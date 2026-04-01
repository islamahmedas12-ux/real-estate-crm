/**
 * E2E Tests: Contract Workflow + Invoices — Real Estate CRM
 * Issue: #61 (M3-8)
 *
 * Tests UI page loading and API security boundaries.
 * Authenticated CRUD is covered by API integration tests (test/*.integration.spec.ts).
 */

import { test, expect, request } from '@playwright/test';
import { ADMIN_URL, API_URL } from './fixtures/index.js';

// ─── Contracts UI Tests ──────────────────────────────────────────────────────

test.describe('Admin Portal — Contracts page', () => {
  test('Contracts route redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${ADMIN_URL}/contracts`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('auth');
    expect(isProtected).toBeTruthy();
    await context.close();
  });
});

// ─── Invoices UI Tests ───────────────────────────────────────────────────────

test.describe('Admin Portal — Invoices page', () => {
  test('Invoices route redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${ADMIN_URL}/invoices`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('auth');
    expect(isProtected).toBeTruthy();
    await context.close();
  });
});

// ─── API Security Boundary Tests ─────────────────────────────────────────────

test.describe('API — Contracts & Invoices (no-auth boundary)', () => {
  test('GET /contracts without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/contracts')).status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /contracts without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.post('/contracts', { data: {} })).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /contracts/stats without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/contracts/stats')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /contracts/expiring without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/contracts/expiring')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /invoices without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/invoices')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /invoices/stats without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/invoices/stats')).status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /invoices/overdue without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/invoices/overdue')).status()).toBe(401);
    await ctx.dispose();
  });
});
