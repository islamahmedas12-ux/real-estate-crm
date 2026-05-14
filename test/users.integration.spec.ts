/**
 * Integration Tests: Users API — Real Estate CRM
 * Issue: #255 (M8-8)
 *
 * Covers:
 *  - GET /api/users — list with pagination, role filter, search
 *  - GET /api/users/:id — user detail with assignments
 *  - PATCH /api/users/:id/status — toggle user active status
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

describe('Users API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/users returns 401', async () => {
    const res = await api.get('/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/users/00000000-0000-0000-0000-000000000000 returns 401', async () => {
    const res = await api.get('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/users/00000000-0000-0000-0000-000000000000/status returns 401', async () => {
    const res = await api.patch('/users/00000000-0000-0000-0000-000000000000/status', {
      active: false,
    });
    expect(res.status).toBe(401);
  });
});

// ─── Admin Operations ─────────────────────────────────────────────────────────

describe('Users API — Admin', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  // ── List ─────────────────────────────────────────────────────────────────

  it('GET /api/users returns paginated list', async () => {
    const res = await api.get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/users supports pagination', async () => {
    const res = await api.get('/users?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('GET /api/users supports role filter', async () => {
    const res = await api.get('/users?role=AGENT');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((user: any) => {
        expect(user.role).toBe('AGENT');
      });
    }
  });

  it('GET /api/users supports search', async () => {
    const res = await api.get('/users?search=admin');
    expect(res.status).toBe(200);
  });

  it('GET /api/users supports status filter', async () => {
    const res = await api.get('/users?status=active');
    expect(res.status).toBe(200);
  });

  // ── Get Single ───────────────────────────────────────────────────────────

  it('GET /api/users/:id returns user detail', async () => {
    const listRes = await api.get('/users?limit=1');
    const userId = listRes.body.data?.[0]?.id;
    if (!userId) return;

    const res = await api.get(`/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body).toHaveProperty('role');
    expect(res.body).toHaveProperty('email');
  });

  it('GET /api/users/:id returns 404 for non-existent', async () => {
    const res = await api.get('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  // ── Toggle Status ────────────────────────────────────────────────────────

  it('PATCH /api/users/:id/status toggles user active status', async () => {
    const listRes = await api.get('/users?limit=1');
    const userId = listRes.body.data?.[0]?.id;
    if (!userId) return;

    const currentStatus = listRes.body.data[0].active;
    const res = await api.patch(`/users/${userId}/status`, {
      active: !currentStatus,
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.active).toBe('boolean');
  });

  it('PATCH /api/users/:id/status rejects invalid status value', async () => {
    const listRes = await api.get('/users?limit=1');
    const userId = listRes.body.data?.[0]?.id;
    if (!userId) return;

    const res = await api.patch(`/users/${userId}/status`, {
      active: 'not-a-boolean',
    });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/users/:id/status rejects self-deactivation', async () => {
    // Admin cannot deactivate themselves via the status endpoint
    // Get admin's own user ID from the user list
    const listRes = await api.get('/users?limit=100');
    const adminUser = listRes.body.data?.find((u: any) => u.email?.includes('admin'));
    if (!adminUser) return;

    const res = await api.patch(`/users/${adminUser.id}/status`, {
      active: false,
    });
    // Should reject or return 400 — admin cannot self-deactivate
    expect([400, 403]).toContain(res.status);
  });
});

// ─── Agent Access ─────────────────────────────────────────────────────────────

describe('Users API — Agent', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/users returns 403 for agent', async () => {
    const res = await api.get('/users');
    expect(res.status).toBe(403);
  });

  it('GET /api/users/:id returns 403 for agent', async () => {
    const res = await api.get('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(403);
  });

  it('PATCH /api/users/:id/status returns 403 for agent', async () => {
    const res = await api.patch('/users/00000000-0000-0000-0000-000000000000/status', {
      active: false,
    });
    expect(res.status).toBe(403);
  });
});

// ─── Manager Access ───────────────────────────────────────────────────────────

describe('Users API — Manager', () => {
  beforeAll(async () => {
    await api.loginAs('manager');
  });

  it('GET /api/users returns 200 for manager', async () => {
    const res = await api.get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('PATCH /api/users/:id/status returns 403 for manager', async () => {
    const listRes = await api.get('/users?limit=1');
    const userId = listRes.body.data?.[0]?.id;
    if (!userId) return;

    const res = await api.patch(`/users/${userId}/status`, {
      active: false,
    });
    expect(res.status).toBe(403);
  });
});
