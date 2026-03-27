/**
 * e2e/health.spec.ts — API Health Check E2E Tests
 *
 * Issue #13: E2E Playwright Setup
 * Implemented by: Karim Mostafa (Backend Developer)
 *
 * Basic health check tests that verify:
 *  - The API server is reachable
 *  - The /health endpoint returns 200 with expected structure
 *  - Unauthenticated access to protected routes returns 401
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

test.describe('API Health Checks', () => {
  test('GET /health returns 200 OK', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /health returns expected status structure', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // NestJS Terminus health check response
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

  test('GET /health includes database status', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    const body = await response.json();
    // Should include info about system components
    expect(body).toHaveProperty('info');
  });

  test('Unauthenticated request to protected API returns 401', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/properties`);
    expect(response.status()).toBe(401);
  });

  test('API returns JSON content type', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('Non-existent route returns 404', async ({ request }) => {
    const response = await request.get(`${API_URL}/non-existent-route-xyz`);
    expect(response.status()).toBe(404);
  });
});
