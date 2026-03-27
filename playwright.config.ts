import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration — Real Estate CRM
 * Prepared by Sara Mostafa (QA Automation)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  /* Shared settings for all projects */
  use: {
    /* Base URL for the Admin Portal */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    /* Collect trace on failure */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'on-first-retry',
    /* Navigation timeout */
    navigationTimeout: 30_000,
    /* Action timeout */
    actionTimeout: 10_000,
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup: authenticate and store session state */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* Admin Portal — Chrome */
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_ADMIN_URL || 'http://localhost:5173',
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /agent\//,
    },

    /* Agent Portal — Chrome */
    {
      name: 'agent-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_AGENT_URL || 'http://localhost:5174',
        storageState: 'e2e/.auth/agent.json',
      },
      dependencies: ['setup'],
      testMatch: /agent\//,
    },

    /* Mobile viewport — Admin */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.E2E_ADMIN_URL || 'http://localhost:5173',
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /agent\//,
    },
  ],

  /* Run local dev server before starting tests (optional in CI) */
  // webServer: [
  //   {
  //     command: 'npm run start:dev',
  //     url: 'http://localhost:3000/health',
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'npm run admin:dev',
  //     url: 'http://localhost:5173',
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
