/**
 * E2E Tests: Invoices — Real Estate CRM
 * Issue: #256 (M8-9)
 *
 * Covers UI page loading and API security boundaries for invoices.
 */

import { test, expect, request } from '@playwright/test';
import { ADMIN_URL, API_URL } from './fixtures/index.js';

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

  test('Authenticated admin can access invoices page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/invoices`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/invoices');
  });
});

test.describe('API — Invoice endpoints (no-auth boundary)', () => {
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

  test('POST /invoices without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.post('/invoices', { data: {} })).status()).toBe(401);
    await ctx.dispose();
  });

  test('PATCH /invoices/:id/pay without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect(
      (
        await ctx.patch('/invoices/00000000-0000-0000-0000-000000000000/pay', {
          data: { amount: 1000 },
        })
      ).status(),
    ).toBe(401);
    await ctx.dispose();
  });
});
