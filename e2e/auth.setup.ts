/**
 * Auth Setup — Real Estate CRM E2E
 *
 * Gets tokens via password grant and injects them into browser storage
 * so E2E tests can access authenticated pages without going through
 * the full OIDC browser redirect flow.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { TEST_USERS, ADMIN_URL, AGENT_URL } from './fixtures/index.js';

const adminAuthFile = path.join(__dirname, '.auth', 'admin.json');
const agentAuthFile = path.join(__dirname, '.auth', 'agent.json');

const AUTH_URL = process.env.E2E_AUTH_URL || 'https://qa-auth.realstate-crm.homes';
const AUTH_REALM = process.env.E2E_AUTH_REALM || 'real-estate-qa';
const CLIENT_ID = 'crm-backend';
const CLIENT_SECRET = process.env.E2E_CLIENT_SECRET || '797e5cb4a67875e49f1711c7b7624db6fd6ff6ec4684dcc445715ec5208a85da';

async function getToken(username: string, password: string): Promise<any> {
  const res = await fetch(
    `${AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token request failed for ${username}: ${res.status} ${body}`);
  }
  return res.json();
}

// ─── Admin Setup ──────────────────────────────────────────────────────────────

setup('authenticate as admin', async ({ page }) => {
  const tokenData = await getToken(TEST_USERS.admin.username, TEST_USERS.admin.password);

  // Navigate to admin portal and inject tokens into sessionStorage
  await page.goto(ADMIN_URL);
  await page.waitForLoadState('domcontentloaded');

  // The authme-sdk stores tokens in sessionStorage with keys like:
  // authme_token, authme_refresh_token, authme_user, etc.
  // We inject them so the app thinks the user is already logged in.
  await page.evaluate((data) => {
    const { access_token, refresh_token, expires_in } = data;
    const expiresAt = Date.now() + expires_in * 1000;

    // authme-sdk storage keys
    sessionStorage.setItem('authme_access_token', access_token);
    sessionStorage.setItem('authme_refresh_token', refresh_token || '');
    sessionStorage.setItem('authme_token_expires_at', String(expiresAt));
    sessionStorage.setItem('authme_authenticated', 'true');

    // Also try localStorage in case the SDK uses it
    localStorage.setItem('authme_access_token', access_token);
    localStorage.setItem('authme_refresh_token', refresh_token || '');
    localStorage.setItem('authme_token_expires_at', String(expiresAt));
    localStorage.setItem('authme_authenticated', 'true');
  }, tokenData);

  // Save auth state (cookies + storage)
  await page.context().storageState({ path: adminAuthFile });
});

// ─── Agent Setup ──────────────────────────────────────────────────────────────

setup('authenticate as agent', async ({ page }) => {
  const tokenData = await getToken(TEST_USERS.agent.username, TEST_USERS.agent.password);

  await page.goto(AGENT_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate((data) => {
    const { access_token, refresh_token, expires_in } = data;
    const expiresAt = Date.now() + expires_in * 1000;

    sessionStorage.setItem('authme_access_token', access_token);
    sessionStorage.setItem('authme_refresh_token', refresh_token || '');
    sessionStorage.setItem('authme_token_expires_at', String(expiresAt));
    sessionStorage.setItem('authme_authenticated', 'true');

    localStorage.setItem('authme_access_token', access_token);
    localStorage.setItem('authme_refresh_token', refresh_token || '');
    localStorage.setItem('authme_token_expires_at', String(expiresAt));
    localStorage.setItem('authme_authenticated', 'true');
  }, tokenData);

  await page.context().storageState({ path: agentAuthFile });
});
