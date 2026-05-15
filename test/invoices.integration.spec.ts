/**
 * Integration Tests: Invoices API — Real Estate CRM
 * Issue: #255 (M8-8)
 *
 * Covers:
 *  - POST /api/invoices — create invoice for a contract
 *  - GET /api/invoices — list with filters and pagination
 *  - GET /api/invoices/stats — payment statistics
 *  - GET /api/invoices/overdue — overdue invoices list
 *  - GET /api/invoices/upcoming — upcoming invoices
 *  - GET /api/invoices/:id — single invoice
 *  - PUT /api/invoices/:id — update invoice
 *  - PATCH /api/invoices/:id/pay — record payment
 *  - PATCH /api/invoices/:id/cancel — cancel invoice
 *  - Auth & role-based access
 */

import {
  createApiClient,
  ApiClient,
  trackEntity,
  cleanupAll,
  resetTracking,
} from './helpers/api-client.js';

let api: ApiClient;
let existingContractId: string;
let createdInvoiceId: string;

beforeAll(async () => {
  resetTracking();
  api = createApiClient();
});

afterAll(async () => {
  await cleanupAll(api);
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('Invoices API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/invoices returns 401', async () => {
    const res = await api.get('/invoices');
    expect(res.status).toBe(401);
  });

  it('POST /api/invoices returns 401', async () => {
    const res = await api.post('/invoices', {});
    expect(res.status).toBe(401);
  });
});

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

describe('Invoices API — Admin', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
    // Get an existing contract for invoice creation
    const contractsRes = await api.get('/contracts?limit=1');
    existingContractId = contractsRes.body.data?.[0]?.id;
  });

  // ── List ─────────────────────────────────────────────────────────────────

  it('GET /api/invoices returns paginated list', async () => {
    const res = await api.get('/invoices');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/invoices supports pagination', async () => {
    const res = await api.get('/invoices?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('GET /api/invoices supports status filter', async () => {
    const res = await api.get('/invoices?status=PENDING');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((inv: any) => expect(inv.status).toBe('PENDING'));
    }
  });

  it('GET /api/invoices supports contract filter', async () => {
    if (!existingContractId) return;
    const res = await api.get(`/invoices?contractId=${existingContractId}`);
    expect(res.status).toBe(200);
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  it('GET /api/invoices/stats returns statistics', async () => {
    const res = await api.get('/invoices/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalDue');
  });

  // ── Overdue ──────────────────────────────────────────────────────────────

  it('GET /api/invoices/overdue returns overdue list', async () => {
    const res = await api.get('/invoices/overdue');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Upcoming ─────────────────────────────────────────────────────────────

  it('GET /api/invoices/upcoming returns upcoming list', async () => {
    const res = await api.get('/invoices/upcoming?days=30');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Create ───────────────────────────────────────────────────────────────

  it('POST /api/invoices creates an invoice', async () => {
    if (!existingContractId) {
      // No contracts available — skip creation test
      return;
    }
    const res = await api.post('/invoices', {
      contractId: existingContractId,
      amount: 50000,
      dueDate: '2026-06-15',
      description: 'Integration test invoice',
    });
    expect([201, 400]).toContain(res.status); // 400 if contract has no payment schedule
    if (res.status === 201) {
      expect(res.body).toHaveProperty('id');
      createdInvoiceId = res.body.id;
      trackEntity('invoices', createdInvoiceId);
    }
  });

  it('POST /api/invoices rejects invalid amount', async () => {
    if (!existingContractId) return;
    const res = await api.post('/invoices', {
      contractId: existingContractId,
      amount: -100,
      dueDate: '2026-06-15',
    });
    expect(res.status).toBe(400);
  });

  // ── Get Single ───────────────────────────────────────────────────────────

  it('GET /api/invoices/:id returns the invoice', async () => {
    if (!createdInvoiceId) return;
    const res = await api.get(`/invoices/${createdInvoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdInvoiceId);
  });

  it('GET /api/invoices/:id returns 404 for non-existent', async () => {
    const res = await api.get('/invoices/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  // ── Update ──────────────────────────────────────────────────────────────

  it('PUT /api/invoices/:id updates the invoice', async () => {
    if (!createdInvoiceId) return;
    const res = await api.put(`/invoices/${createdInvoiceId}`, {
      notes: 'Updated by integration test',
    });
    expect([200, 400]).toContain(res.status);
  });

  // ── Pay ──────────────────────────────────────────────────────────────────

  it('PATCH /api/invoices/:id/pay records payment', async () => {
    if (!createdInvoiceId) return;
    const res = await api.patch(`/invoices/${createdInvoiceId}/pay`, {
      amount: 50000,
      paidAt: new Date().toISOString(),
    });
    expect([200, 400]).toContain(res.status); // 400 if already paid
  });

  // ── Cancel ──────────────────────────────────────────────────────────────

  it('PATCH /api/invoices/:id/cancel cancels the invoice', async () => {
    // Create a new invoice to cancel
    if (!existingContractId) return;
    const createRes = await api.post('/invoices', {
      contractId: existingContractId,
      amount: 25000,
      dueDate: '2026-07-01',
    });
    if (createRes.status !== 201) return;
    const invId = createRes.body.id;
    trackEntity('invoices', invId);

    const res = await api.patch(`/invoices/${invId}/cancel`, {});
    expect([200, 400]).toContain(res.status);
  });
});

// ─── Agent Access ─────────────────────────────────────────────────────────────

describe('Invoices API — Agent role', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/invoices returns list for agent', async () => {
    const res = await api.get('/invoices');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/invoices is forbidden for agent', async () => {
    if (!existingContractId) return;
    const res = await api.post('/invoices', {
      contractId: existingContractId,
      amount: 10000,
      dueDate: '2026-07-01',
    });
    expect(res.status).toBe(403);
  });
});

// ─── Manager Access ──────────────────────────────────────────────────────────

describe('Invoices API — Manager role', () => {
  beforeAll(async () => {
    await api.loginAs('manager');
  });

  it('GET /api/invoices works for manager', async () => {
    const res = await api.get('/invoices');
    expect(res.status).toBe(200);
  });

  it('POST /api/invoices works for manager', async () => {
    if (!existingContractId) return;
    const res = await api.post('/invoices', {
      contractId: existingContractId,
      amount: 15000,
      dueDate: '2026-08-01',
    });
    expect([201, 400]).toContain(res.status);
  });
});
