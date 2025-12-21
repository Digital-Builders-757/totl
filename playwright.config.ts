import { defineConfig, devices } from '@playwright/test';
import dotenv from "dotenv";

// Ensure Playwright has the same env vars as local dev (especially SUPABASE_SERVICE_ROLE_KEY).
// `dotenv/config` only loads `.env` by default, but this repo uses `.env.local`.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Local Windows runs can get flaky with too many workers (OneDrive + `next start` + Chromium).
  // Prefer reliability; override locally via `PW_WORKERS=<n>` if desired.
  workers: process.env.CI ? 1 : Number(process.env.PW_WORKERS ?? 2),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects (Chrome only) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Prevent tests from hitting the real email provider (rate limits, flakiness).
    // Use `next start` (not `next dev`) to reduce Windows/OneDrive `.next\\trace` file-lock flakiness.
    command:
      'cmd /d /c "set DISABLE_EMAIL_SENDING=1&& set INTERNAL_EMAIL_API_KEY=dev-internal-email-key&& set NEXT_TELEMETRY_DISABLED=1&& (if not exist .next\\BUILD_ID (npm run build)) && npm run start"',
    url: 'http://localhost:3000',
    // Reliability-first: avoid reusing an already-running server, which can mask stale builds and cause false failures.
    // If you explicitly want reuse for speed, set PW_REUSE_SERVER=1 locally.
    reuseExistingServer: Boolean(process.env.PW_REUSE_SERVER) && !process.env.CI,
    timeout: 600 * 1000,
  },
});
