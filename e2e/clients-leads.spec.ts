/**
 * E2E Tests: Client Management + Lead Pipeline — Real Estate CRM
 * Issue: #60 (M3-7)
 *
 * Tests UI page loading and API security boundaries.
 * Authenticated CRUD is covered by API integration tests (test/*.integration.spec.ts).
 */

import { test, expect, request } from '@playwright/test';
import { ADMIN_URL, API_URL } from './fixtures/index.js';

// ─── Clients UI Tests ────────────────────────────────────────────────────────

test.describe('Admin Portal — Clients page', () => {
  test('Clients route redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${ADMIN_URL}/clients`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('auth');
    expect(isProtected).toBeTruthy();
    await context.close();
  });
});

// ─── Leads UI Tests ──────────────────────────────────────────────────────────

test.describe('Admin Portal — Leads page', () => {
  test('Leads route redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${ADMIN_URL}/leads`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('auth');
    expect(isProtected).toBeTruthy();
    await context.close();
  });
});

// ─── API Security Boundary Tests ─────────────────────────────────────────────

test.describe('API — Clients & Leads (no-auth boundary)', () => {
  test('GET /clients without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/clients')).status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /clients without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.post('/clients', { data: { firstName: 'Test' } })).status()).toBe(401);
    await ctx.dispose();
  });

  test('DELETE /clients/:id without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.delete('/clients/00000000-0000-0000-0000-000000000000')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /leads without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/leads')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /leads/pipeline without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/leads/pipeline')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /leads/stats without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/leads/stats')).status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /leads without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.post('/leads', { data: {} })).status()).toBe(401);
    await ctx.dispose();
  });
});
