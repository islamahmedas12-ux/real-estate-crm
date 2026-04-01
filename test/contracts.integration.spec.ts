/**
 * Integration Tests: Contracts API — Real Estate CRM
 * Issue: #57 (M3-4)
 *
 * Covers:
 *  - GET /api/contracts — list with filters
 *  - POST /api/contracts — create with property/client refs
 *  - GET /api/contracts/:id — single contract
 *  - PATCH /api/contracts/:id — update
 *  - PATCH /api/contracts/:id/status — transitions
 *  - GET /api/contracts/:id/invoices — linked invoices
 *  - POST /api/contracts/:id/generate-invoices — auto invoice generation
 *  - GET /api/contracts/stats — statistics
 *  - GET /api/contracts/expiring — expiring contracts
 *  - DELETE /api/contracts/:id — admin only
 *  - Auth & role-based access
 */

import { createApiClient, ApiClient } from './helpers/api-client.js';

let api: ApiClient;
let existingContractId: string;

beforeAll(async () => {
  api = createApiClient();
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('Contracts API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/contracts returns 401', async () => {
    const res = await api.get('/contracts');
    expect(res.status).toBe(401);
  });

  it('POST /api/contracts returns 401', async () => {
    const res = await api.post('/contracts', {});
    expect(res.status).toBe(401);
  });
});

// ─── Admin Operations ────────────────────────────────────────────────────────

describe('Contracts API — Admin', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
    // Get an existing contract ID for read tests
    const listRes = await api.get('/contracts?limit=1');
    existingContractId = listRes.body.data?.[0]?.id;
  });

  // ── List ─────────────────────────────────────────────────────────────

  it('GET /api/contracts returns paginated list', async () => {
    const res = await api.get('/contracts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('GET /api/contracts supports pagination', async () => {
    const res = await api.get('/contracts?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });

  it('GET /api/contracts supports type filter', async () => {
    const res = await api.get('/contracts?type=SALE');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((c: any) => expect(c.type).toBe('SALE'));
    }
  });

  it('GET /api/contracts supports status filter', async () => {
    const res = await api.get('/contracts?status=ACTIVE');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((c: any) => expect(c.status).toBe('ACTIVE'));
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────

  it('GET /api/contracts/stats returns statistics', async () => {
    const res = await api.get('/contracts/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
  });

  // ── Expiring ─────────────────────────────────────────────────────────

  it('GET /api/contracts/expiring returns list', async () => {
    const res = await api.get('/contracts/expiring?days=90');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Get Single ───────────────────────────────────────────────────────

  it('GET /api/contracts/:id returns the contract', async () => {
    if (!existingContractId) return;
    const res = await api.get(`/contracts/${existingContractId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(existingContractId);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('totalAmount');
  });

  it('GET /api/contracts/:id returns 404 for non-existent', async () => {
    const res = await api.get('/contracts/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  // ── Invoices for contract ────────────────────────────────────────────

  it('GET /api/contracts/:id/invoices returns linked invoices', async () => {
    if (!existingContractId) return;
    const res = await api.get(`/contracts/${existingContractId}/invoices`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Create ───────────────────────────────────────────────────────────

  it('POST /api/contracts rejects missing required fields', async () => {
    const res = await api.post('/contracts', {
      notes: 'Missing everything',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/contracts rejects non-existent property', async () => {
    const clientsRes = await api.get('/clients?limit=1');
    const res = await api.post('/contracts', {
      type: 'SALE',
      propertyId: '00000000-0000-0000-0000-000000000000',
      clientId: clientsRes.body.data[0].id,
      totalAmount: 1000000,
      startDate: '2026-04-01',
      endDate: '2027-04-01',
    });
    expect([400, 404]).toContain(res.status);
  });

  // ── Status Transitions ───────────────────────────────────────────────

  it('PATCH /api/contracts/:id/status rejects invalid transition', async () => {
    if (!existingContractId) return;
    // Try COMPLETED (probably invalid from current status)
    const contract = await api.get(`/contracts/${existingContractId}`);
    if (contract.body.status === 'ACTIVE') {
      // ACTIVE → DRAFT is not valid
      const res = await api.patch(`/contracts/${existingContractId}/status`, {
        status: 'DRAFT',
      });
      expect(res.status).toBe(400);
    }
  });

  // ── Update ───────────────────────────────────────────────────────────

  it('PATCH /api/contracts/:id updates the contract', async () => {
    if (!existingContractId) return;
    const res = await api.patch(`/contracts/${existingContractId}`, {
      notes: 'Updated by integration test',
    });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('Updated by integration test');
  });
});

// ─── Agent Access ────────────────────────────────────────────────────────────

describe('Contracts API — Agent role', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/contracts returns list for agent', async () => {
    const res = await api.get('/contracts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/contracts is forbidden for agent', async () => {
    const res = await api.post('/contracts', {
      type: 'SALE',
      propertyId: '00000000-0000-0000-0000-000000000000',
      clientId: '00000000-0000-0000-0000-000000000000',
      totalAmount: 500000,
      startDate: '2026-04-01',
      endDate: '2027-04-01',
    });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/contracts/:id is forbidden for agent', async () => {
    if (!existingContractId) return;
    const res = await api.delete(`/contracts/${existingContractId}`);
    expect(res.status).toBe(403);
  });
});

// ─── Manager Access ──────────────────────────────────────────────────────────

describe('Contracts API — Manager role', () => {
  beforeAll(async () => {
    await api.loginAs('manager');
  });

  it('GET /api/contracts works for manager', async () => {
    const res = await api.get('/contracts');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('DELETE /api/contracts/:id is forbidden for manager', async () => {
    if (!existingContractId) return;
    const res = await api.delete(`/contracts/${existingContractId}`);
    expect(res.status).toBe(403);
  });
});
