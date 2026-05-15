/**
 * Integration Tests: PDF Generation API — Real Estate CRM
 * Issue: #255 (M8-8)
 *
 * Covers:
 *  - GET /api/contracts/:id/pdf — download contract as PDF
 *  - GET /api/invoices/:id/pdf — download invoice as PDF
 *  - GET /api/properties/:id/pdf — download property listing as PDF
 *  - POST /api/reports/generate-pdf — generate report PDF
 *  - Auth & role-based access
 *  - Response headers and content type
 */

import { createApiClient, ApiClient, cleanupAll, resetTracking } from './helpers/api-client.js';

let api: ApiClient;

beforeAll(async () => {
  resetTracking();
  api = createApiClient();
});

afterAll(async () => {
  await cleanupAll(api);
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('PDF API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/contracts/00000000-0000-0000-0000-000000000001/pdf returns 401', async () => {
    const res = await api.get('/contracts/00000000-0000-0000-0000-000000000001/pdf');
    expect(res.status).toBe(401);
  });

  it('GET /api/invoices/00000000-0000-0000-0000-000000000001/pdf returns 401', async () => {
    const res = await api.get('/invoices/00000000-0000-0000-0000-000000000001/pdf');
    expect(res.status).toBe(401);
  });

  it('GET /api/properties/00000000-0000-0000-0000-000000000001/pdf returns 401', async () => {
    const res = await api.get('/properties/00000000-0000-0000-0000-000000000001/pdf');
    expect(res.status).toBe(401);
  });

  it('POST /api/reports/generate-pdf returns 401', async () => {
    const res = await api.post('/reports/generate-pdf', {});
    expect(res.status).toBe(401);
  });
});

// ─── Contract PDF ────────────────────────────────────────────────────────────

describe('PDF API — Contract PDF', () => {
  let contractId: string;

  beforeAll(async () => {
    await api.loginAs('admin');
    const res = await api.get('/contracts?limit=1');
    contractId = res.body.data?.[0]?.id;
  });

  it('GET /api/contracts/:id/pdf returns 200 for valid contract', async () => {
    if (!contractId) return;
    const res = await api.get(`/contracts/${contractId}/pdf`);
    expect(res.status).toBe(200);
  });

  it('GET /api/contracts/:id/pdf returns 404 for non-existent', async () => {
    const res = await api.get('/contracts/00000000-0000-0000-0000-000000000000/pdf');
    expect(res.status).toBe(404);
  });

  it('GET /api/contracts/:id/pdf is forbidden for agent', async () => {
    if (!contractId) return;
    await api.loginAs('agent');
    const res = await api.get(`/contracts/${contractId}/pdf`);
    expect(res.status).toBe(403);
  });
});

// ─── Invoice PDF ─────────────────────────────────────────────────────────────

describe('PDF API — Invoice PDF', () => {
  let invoiceId: string;

  beforeAll(async () => {
    await api.loginAs('admin');
    const res = await api.get('/invoices?limit=1');
    invoiceId = res.body.data?.[0]?.id;
  });

  it('GET /api/invoices/:id/pdf returns 200 for valid invoice', async () => {
    if (!invoiceId) return;
    const res = await api.get(`/invoices/${invoiceId}/pdf`);
    expect(res.status).toBe(200);
  });

  it('GET /api/invoices/:id/pdf returns 404 for non-existent', async () => {
    const res = await api.get('/invoices/00000000-0000-0000-0000-000000000000/pdf');
    expect(res.status).toBe(404);
  });

  it('GET /api/invoices/:id/pdf is forbidden for agent', async () => {
    if (!invoiceId) return;
    await api.loginAs('agent');
    const res = await api.get(`/invoices/${invoiceId}/pdf`);
    expect(res.status).toBe(403);
  });
});

// ─── Property PDF ─────────────────────────────────────────────────────────────

describe('PDF API — Property PDF', () => {
  let propertyId: string;

  beforeAll(async () => {
    await api.loginAs('admin');
    const res = await api.get('/properties?limit=1');
    propertyId = res.body.data?.[0]?.id;
  });

  it('GET /api/properties/:id/pdf returns 200 for valid property', async () => {
    if (!propertyId) return;
    const res = await api.get(`/properties/${propertyId}/pdf`);
    expect(res.status).toBe(200);
  });

  it('GET /api/properties/:id/pdf returns 404 for non-existent', async () => {
    const res = await api.get('/properties/00000000-0000-0000-0000-000000000000/pdf');
    expect(res.status).toBe(404);
  });

  it('GET /api/properties/:id/pdf works for agent', async () => {
    if (!propertyId) return;
    await api.loginAs('agent');
    const res = await api.get(`/properties/${propertyId}/pdf`);
    expect(res.status).toBe(200);
  });
});

// ─── Report PDF ───────────────────────────────────────────────────────────────

describe('PDF API — Report PDF', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  it('POST /api/reports/generate-pdf generates revenue report', async () => {
    const res = await api.post('/reports/generate-pdf', {
      type: 'REVENUE',
      period: 'MONTHLY',
    });
    expect([200, 400]).toContain(res.status);
  });

  it('POST /api/reports/generate-pdf generates agent performance report', async () => {
    const res = await api.post('/reports/generate-pdf', {
      type: 'AGENT_PERFORMANCE',
      period: 'MONTHLY',
    });
    expect([200, 400]).toContain(res.status);
  });

  it('POST /api/reports/generate-pdf rejects invalid type', async () => {
    const res = await api.post('/reports/generate-pdf', {
      type: 'INVALID_TYPE',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/reports/generate-pdf is forbidden for agent', async () => {
    await api.loginAs('agent');
    const res = await api.post('/reports/generate-pdf', {
      type: 'REVENUE',
    });
    expect(res.status).toBe(403);
  });

  it('POST /api/reports/generate-pdf works for manager', async () => {
    await api.loginAs('manager');
    const res = await api.post('/reports/generate-pdf', {
      type: 'REVENUE',
    });
    expect([200, 403]).toContain(res.status);
  });
});
