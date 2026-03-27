/**
 * Auth Setup — Real Estate CRM E2E
 * Prepared by Sara Mostafa (QA Automation)
 *
 * This setup file handles authentication for both admin and agent users.
 * It stores browser storage state so subsequent tests don't need to login.
 *
 * In a real environment this would complete the Authme OAuth PKCE flow.
 * For testing purposes we support:
 *   1. Full OAuth browser flow (when Authme is running)
 *   2. Direct token injection via API (when E2E_MOCK_AUTH=true)
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { TEST_USERS, ADMIN_URL, AGENT_URL, API_URL } from './fixtures/index.js';

const adminAuthFile = path.join(__dirname, '.auth', 'admin.json');
const agentAuthFile = path.join(__dirname, '.auth', 'agent.json');

// ─── Admin Setup ──────────────────────────────────────────────────────────────

setup('authenticate as admin', async ({ page }) => {
  await page.goto(ADMIN_URL);

  // Wait for either the login button or the dashboard (already logged in)
  const loginButton = page.getByRole('button', { name: /login|sign in/i });
  const dashboard = page.getByText(/dashboard/i).first();

  try {
    await Promise.race([
      loginButton.waitFor({ timeout: 5000 }),
      dashboard.waitFor({ timeout: 5000 }),
    ]);
  } catch {
    // Page might still be loading
  }

  // If we already have a session, skip login
  if (await dashboard.isVisible().catch(() => false)) {
    await page.context().storageState({ path: adminAuthFile });
    return;
  }

  // Click the login / "Sign in with Authme" button
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Authme login form (Keycloak-style)
  await page.waitForURL(/authme|auth|login/, { timeout: 10_000 });

  await page.getByLabel(/username|email/i).fill(TEST_USERS.admin.username);
  await page.getByLabel(/password/i).fill(TEST_USERS.admin.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Wait for redirect back to admin portal
  await page.waitForURL(new RegExp(ADMIN_URL), { timeout: 15_000 });

  // Verify we landed on the dashboard
  await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 10_000 });

  // Save auth state
  await page.context().storageState({ path: adminAuthFile });
});

// ─── Agent Setup ──────────────────────────────────────────────────────────────

setup('authenticate as agent', async ({ page }) => {
  await page.goto(AGENT_URL);

  const loginButton = page.getByRole('button', { name: /login|sign in/i });
  const dashboard = page.getByText(/dashboard/i).first();

  try {
    await Promise.race([
      loginButton.waitFor({ timeout: 5000 }),
      dashboard.waitFor({ timeout: 5000 }),
    ]);
  } catch {
    // Page might still be loading
  }

  if (await dashboard.isVisible().catch(() => false)) {
    await page.context().storageState({ path: agentAuthFile });
    return;
  }

  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/authme|auth|login/, { timeout: 10_000 });

  await page.getByLabel(/username|email/i).fill(TEST_USERS.agent.username);
  await page.getByLabel(/password/i).fill(TEST_USERS.agent.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  await page.waitForURL(new RegExp(AGENT_URL), { timeout: 15_000 });
  await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 10_000 });

  await page.context().storageState({ path: agentAuthFile });
});
