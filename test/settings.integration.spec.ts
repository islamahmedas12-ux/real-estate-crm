/**
 * Integration Tests: Settings API — Real Estate CRM
 * Issue: #255 (M8-8)
 *
 * Covers:
 *  - GET /api/settings/company — get company settings
 *  - PUT /api/settings/company — update company settings
 *  - GET /api/settings/property-types — get property type config
 *  - PUT /api/settings/property-types — update property type config
 *  - GET /api/settings/lead-sources — get lead source config
 *  - PUT /api/settings/lead-sources — update lead source config
 *  - Auth & role-based access
 */

import { createApiClient, ApiClient, cleanupAll } from './helpers/api-client.js';

let api: ApiClient;

beforeAll(async () => {
  api = createApiClient();
});

afterAll(async () => {
  await cleanupAll(api);
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('Settings API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/settings/company returns 401', async () => {
    const res = await api.get('/settings/company');
    expect(res.status).toBe(401);
  });

  it('PUT /api/settings/company returns 401', async () => {
    const res = await api.put('/settings/company', {});
    expect(res.status).toBe(401);
  });

  it('GET /api/settings/property-types returns 401', async () => {
    const res = await api.get('/settings/property-types');
    expect(res.status).toBe(401);
  });

  it('PUT /api/settings/property-types returns 401', async () => {
    const res = await api.put('/settings/property-types', []);
    expect(res.status).toBe(401);
  });

  it('GET /api/settings/lead-sources returns 401', async () => {
    const res = await api.get('/settings/lead-sources');
    expect(res.status).toBe(401);
  });

  it('PUT /api/settings/lead-sources returns 401', async () => {
    const res = await api.put('/settings/lead-sources', []);
    expect(res.status).toBe(401);
  });
});

// ─── Admin Operations ─────────────────────────────────────────────────────────

describe('Settings API — Admin', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  // ── Company Settings ─────────────────────────────────────────────────────

  it('GET /api/settings/company returns company settings', async () => {
    const res = await api.get('/settings/company');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('companyName');
  });

  it('PUT /api/settings/company updates settings', async () => {
    const res = await api.put('/settings/company', {
      companyName: 'Updated CRM Co.',
    });
    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe('Updated CRM Co.');
  });

  it('PUT /api/settings/company rejects invalid data', async () => {
    const res = await api.put('/settings/company', {
      emailVerificationRequired: 'not-a-boolean',
    });
    expect(res.status).toBe(400);
  });

  // ── Property Types ───────────────────────────────────────────────────────

  it('GET /api/settings/property-types returns property type config', async () => {
    const res = await api.get('/settings/property-types');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/settings/property-types updates config', async () => {
    const res = await api.put('/settings/property-types', [
      { name: 'APARTMENT', active: true },
      { name: 'VILLA', active: true },
      { name: 'LAND', active: false },
    ]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/settings/property-types rejects invalid type', async () => {
    const res = await api.put('/settings/property-types', [{ name: 123, active: true }]);
    expect(res.status).toBe(400);
  });

  // ── Lead Sources ─────────────────────────────────────────────────────────

  it('GET /api/settings/lead-sources returns lead source config', async () => {
    const res = await api.get('/settings/lead-sources');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/settings/lead-sources updates config', async () => {
    const res = await api.put('/settings/lead-sources', [
      { name: 'WEBSITE', active: true },
      { name: 'REFERRAL', active: true },
      { name: 'COLD_CALL', active: false },
    ]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/settings/lead-sources rejects invalid source', async () => {
    const res = await api.put('/settings/lead-sources', [{ name: '', active: true }]);
    expect(res.status).toBe(400);
  });
});

// ─── Agent Access ─────────────────────────────────────────────────────────────

describe('Settings API — Agent', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/settings/company returns 200 for agent (read-only)', async () => {
    const res = await api.get('/settings/company');
    expect(res.status).toBe(200);
  });

  it('PUT /api/settings/company returns 403 for agent', async () => {
    const res = await api.put('/settings/company', {
      companyName: 'Hacked',
    });
    expect(res.status).toBe(403);
  });

  it('GET /api/settings/property-types returns 200 for agent', async () => {
    const res = await api.get('/settings/property-types');
    expect(res.status).toBe(200);
  });

  it('PUT /api/settings/property-types returns 403 for agent', async () => {
    const res = await api.put('/settings/property-types', []);
    expect(res.status).toBe(403);
  });

  it('GET /api/settings/lead-sources returns 200 for agent', async () => {
    const res = await api.get('/settings/lead-sources');
    expect(res.status).toBe(200);
  });

  it('PUT /api/settings/lead-sources returns 403 for agent', async () => {
    const res = await api.put('/settings/lead-sources', []);
    expect(res.status).toBe(403);
  });
});

// ─── Manager Access ───────────────────────────────────────────────────────────

describe('Settings API — Manager', () => {
  beforeAll(async () => {
    await api.loginAs('manager');
  });

  it('GET /api/settings/company returns 200 for manager', async () => {
    const res = await api.get('/settings/company');
    expect(res.status).toBe(200);
  });

  it('PUT /api/settings/company returns 403 for manager', async () => {
    const res = await api.put('/settings/company', {
      companyName: 'Changed',
    });
    expect(res.status).toBe(403);
  });
});
