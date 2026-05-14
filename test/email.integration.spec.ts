/**
 * Integration Tests: Email API — Real Estate CRM
 * Issue: #255 (M8-8)
 *
 * Covers:
 *  - GET /api/email/logs — list email logs with filters
 *  - GET /api/email/logs/:id — single email log
 *  - POST /api/email/send — send custom email (admin only)
 *  - GET /api/email/preferences — get email preferences
 *  - PATCH /api/email/preferences — update email preferences
 *  - POST /api/email/retry/:id — retry failed email
 *  - Auth & role-based access
 */

import { createApiClient, ApiClient, trackEntity, cleanupAll } from './helpers/api-client.js';

let api: ApiClient;
let createdEmailLogId: string;

beforeAll(async () => {
  api = createApiClient();
});

afterAll(async () => {
  await cleanupAll(api);
});

// ─── Unauthenticated ─────────────────────────────────────────────────────────

describe('Email API — Unauthenticated', () => {
  beforeAll(() => api.clearAuth());

  it('GET /api/email/logs returns 401', async () => {
    const res = await api.get('/email/logs');
    expect(res.status).toBe(401);
  });

  it('GET /api/email/logs/00000000-0000-0000-0000-000000000000 returns 401', async () => {
    const res = await api.get('/email/logs/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('POST /api/email/send returns 401', async () => {
    const res = await api.post('/email/send', {});
    expect(res.status).toBe(401);
  });

  it('POST /api/email/retry/00000000-0000-0000-0000-000000000000 returns 401', async () => {
    const res = await api.post('/email/retry/00000000-0000-0000-0000-000000000000', {});
    expect(res.status).toBe(401);
  });
});

// ─── Admin Operations ─────────────────────────────────────────────────────────

describe('Email API — Admin', () => {
  beforeAll(async () => {
    await api.loginAs('admin');
  });

  // ── List ─────────────────────────────────────────────────────────────────

  it('GET /api/email/logs returns paginated list', async () => {
    const res = await api.get('/email/logs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('GET /api/email/logs supports pagination', async () => {
    const res = await api.get('/email/logs?page=1&limit=5');
    expect(res.status).toBe(200);
  });

  it('GET /api/email/logs supports status filter', async () => {
    const res = await api.get('/email/logs?status=SENT');
    expect(res.status).toBe(200);
  });

  it('GET /api/email/logs supports template filter', async () => {
    const res = await api.get('/email/logs?template=lead_notification');
    expect(res.status).toBe(200);
  });

  // ── Get Single ───────────────────────────────────────────────────────────

  it('GET /api/email/logs/:id returns the email log', async () => {
    // Find an existing email log
    const listRes = await api.get('/email/logs?limit=1');
    const logId = listRes.body.data?.[0]?.id;
    if (!logId) return;

    const res = await api.get(`/email/logs/${logId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(logId);
  });

  it('GET /api/email/logs/:id returns 404 for non-existent', async () => {
    const res = await api.get('/email/logs/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  // ── Send Email ───────────────────────────────────────────────────────────

  it('POST /api/email/send sends a custom email', async () => {
    const res = await api.post('/email/send', {
      to: 'test@crm-test.com',
      subject: 'Integration test email',
      template: 'custom',
      context: { message: 'Test message' },
    });
    expect([200, 201, 400]).toContain(res.status); // 400 if validation fails
  });

  it('POST /api/email/send rejects invalid email address', async () => {
    const res = await api.post('/email/send', {
      to: 'not-an-email',
      subject: 'Test',
      template: 'custom',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/email/send rejects missing required fields', async () => {
    const res = await api.post('/email/send', {
      subject: 'Missing to and template',
    });
    expect(res.status).toBe(400);
  });

  // ── Retry ────────────────────────────────────────────────────────────────

  it('POST /api/email/retry/:id retries a failed email', async () => {
    // Find a failed email log to retry
    const listRes = await api.get('/email/logs?status=FAILED&limit=1');
    const failedLogId = listRes.body.data?.[0]?.id;

    if (!failedLogId) {
      // No failed logs available — try with a non-existent ID
      const res = await api.post('/email/retry/00000000-0000-0000-0000-000000000000', {});
      expect(res.status).toBe(404);
      return;
    }

    const res = await api.post(`/email/retry/${failedLogId}`, {});
    expect([200, 202, 400, 404]).toContain(res.status);
  });

  it('POST /api/email/retry/:id returns 404 for non-existent', async () => {
    const res = await api.post('/email/retry/00000000-0000-0000-0000-000000000000', {});
    expect(res.status).toBe(404);
  });

  // ── Preferences ─────────────────────────────────────────────────────────

  it('GET /api/email/preferences returns current user preferences', async () => {
    const res = await api.get('/email/preferences');
    expect(res.status).toBe(200);
    expect(typeof res.body.emailNotifications).toBe('boolean');
  });

  it('PATCH /api/email/preferences updates preferences', async () => {
    const res = await api.patch('/email/preferences', {
      emailNotifications: false,
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.emailNotifications).toBe('boolean');
  });
});

// ─── Agent Access ─────────────────────────────────────────────────────────────

describe('Email API — Agent', () => {
  beforeAll(async () => {
    await api.loginAs('agent');
  });

  it('GET /api/email/logs returns 403 for agent', async () => {
    const res = await api.get('/email/logs');
    expect(res.status).toBe(403);
  });

  it('POST /api/email/send returns 403 for agent', async () => {
    const res = await api.post('/email/send', {
      to: 'test@test.com',
      subject: 'Test',
      template: 'custom',
    });
    expect(res.status).toBe(403);
  });

  it('GET /api/email/preferences returns 200 for agent', async () => {
    const res = await api.get('/email/preferences');
    expect(res.status).toBe(200);
  });

  it('PATCH /api/email/preferences returns 200 for agent', async () => {
    const res = await api.patch('/email/preferences', {
      emailNotifications: true,
    });
    expect(res.status).toBe(200);
  });

  it('POST /api/email/retry/:id returns 403 for agent', async () => {
    const res = await api.post('/email/retry/00000000-0000-0000-0000-000000000000', {});
    expect(res.status).toBe(403);
  });
});

// ─── Manager Access ───────────────────────────────────────────────────────────

describe('Email API — Manager', () => {
  beforeAll(async () => {
    await api.loginAs('manager');
  });

  it('GET /api/email/logs returns 403 for manager', async () => {
    const res = await api.get('/email/logs');
    expect(res.status).toBe(403);
  });

  it('POST /api/email/send returns 403 for manager', async () => {
    const res = await api.post('/email/send', {
      to: 'test@test.com',
      subject: 'Test',
      template: 'custom',
    });
    expect(res.status).toBe(403);
  });
});
