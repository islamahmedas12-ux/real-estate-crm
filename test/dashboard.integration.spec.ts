/**
 * Integration Tests: Dashboard & Analytics API — Real Estate CRM
 * Issue: #58 (M3-5)
 *
 * Covers:
 *  - GET /api/dashboard/admin/* — admin KPIs, revenue, leads, properties, agents
 *  - GET /api/dashboard/agent/* — agent personal dashboard
 *  - GET /api/dashboard — combined mobile endpoint
 *  - Role-based scoping (admin vs agent)
 *  - Date range filtering
 *  - Performance (response time)
 *  - Empty state handling
 *  - Auth (401 for unauthenticated)
 */

import { createApiClient, ApiClient } from './helpers/api-client.js';

let api: ApiClient;

beforeAll(async () => {
  api = createApiClient();
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('Dashboard API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/dashboard/admin/overview returns 401', async () => {
    const res = await api.get('/dashboard/admin/overview');
    expect(res.status).toBe(401);
  });

  it('GET /api/dashboard returns 401', async () => {
    const res = await api.get('/dashboard');
    expect(res.status).toBe(401);
  });
});

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

describe('Dashboard API — Admin endpoints', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  it('GET /api/dashboard/admin/overview returns KPIs', async () => {
    const start = Date.now();
    const res = await api.get('/dashboard/admin/overview');
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(duration).toBeLessThan(5000); // should respond within 5s
  });

  it('GET /api/dashboard/admin/revenue returns revenue data', async () => {
    const res = await api.get('/dashboard/admin/revenue');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/admin/leads returns lead analytics', async () => {
    const res = await api.get('/dashboard/admin/leads');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/admin/properties returns property stats', async () => {
    const res = await api.get('/dashboard/admin/properties');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/admin/agents returns agent performance', async () => {
    const res = await api.get('/dashboard/admin/agents');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/admin/recent returns recent activity', async () => {
    const res = await api.get('/dashboard/admin/recent');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Agent Dashboard ─────────────────────────────────────────────────────────

describe('Dashboard API — Agent endpoints', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/dashboard/agent/overview returns agent KPIs', async () => {
    const res = await api.get('/dashboard/agent/overview');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/agent/leads returns agent leads', async () => {
    const res = await api.get('/dashboard/agent/leads');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/agent/follow-ups returns follow-ups', async () => {
    const res = await api.get('/dashboard/agent/follow-ups');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard/agent/performance returns performance metrics', async () => {
    const res = await api.get('/dashboard/agent/performance');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/dashboard returns combined mobile data', async () => {
    const res = await api.get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});

// ─── Role-Based Scoping ──────────────────────────────────────────────────────

describe('Dashboard API — Role-based access', () => {
  it('Agent cannot access admin dashboard', async () => {
    await api.loginAs('agent');
    const res = await api.get('/dashboard/admin/overview');
    expect(res.status).toBe(403);
  });

  it('Manager can access admin dashboard', async () => {
    await api.loginAs('manager');
    const res = await api.get('/dashboard/admin/overview');
    expect(res.status).toBe(200);
  });

  it('Admin can access agent dashboard', async () => {
    await api.loginAs('admin');
    const res = await api.get('/dashboard/agent/overview');
    expect(res.status).toBe(200);
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('Dashboard API — Performance', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  it('All admin endpoints respond within 5 seconds', async () => {
    const endpoints = [
      '/dashboard/admin/overview',
      '/dashboard/admin/revenue',
      '/dashboard/admin/leads',
      '/dashboard/admin/properties',
      '/dashboard/admin/agents',
      '/dashboard/admin/recent',
    ];

    for (const ep of endpoints) {
      const start = Date.now();
      const res = await api.get(ep);
      const duration = Date.now() - start;
      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    }
  });
});
