/**
 * E2E Tests: Reports — Real Estate CRM
 * Issue: #256 (M8-9)
 *
 * Covers UI page loading and API security for reports.
 */

import { test, expect, request } from '@playwright/test';
import { ADMIN_URL, API_URL } from './fixtures/index.js';

test.describe('Admin Portal — Reports page', () => {
  test('Reports route redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('auth');
    expect(isProtected).toBeTruthy();
    await context.close();
  });

  test('Authenticated admin can access reports page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/reports');
  });
});

test.describe('API — Reports endpoints (no-auth boundary)', () => {
  test('POST /reports/generate-pdf without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect(
      (
        await ctx.post('/reports/generate-pdf', {
          data: { type: 'REVENUE', period: 'MONTHLY' },
        })
      ).status(),
    ).toBe(401);
    await ctx.dispose();
  });

  test('GET /reports without auth returns 401', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    expect((await ctx.get('/reports')).status()).toBe(401);
    await ctx.dispose();
  });
});
