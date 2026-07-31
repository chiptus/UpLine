import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */

const port = process.env.CI ? 4173 : 8080;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

const consentedStorageState = {
  cookies: [],
  origins: [
    {
      origin: new URL(baseURL).origin,
      localStorage: [
        {
          name: "gdpr-consent",
          value: JSON.stringify({
            essential: true,
            analytics: false,
            preferences: false,
            marketing: false,
            version: "1.0",
            timestamp: 0,
          }),
        },
      ],
    },
  ],
};

const COOKIE_CONSENT_SPEC = /cookie-consent\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["blob"], ["html"]] : "html",
  /* Whole-test budget: sign-in flows + navigations under full parallel
   * load routinely exceed the 30s default on local runs. */
  timeout: process.env.CI ? undefined : 60_000,
  expect: { timeout: process.env.CI ? undefined : 15_000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "retain-on-failure",

    storageState: consentedStorageState,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: COOKIE_CONSENT_SPEC,
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: COOKIE_CONSENT_SPEC,
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: COOKIE_CONSENT_SPEC,
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      testIgnore: COOKIE_CONSENT_SPEC,
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      testIgnore: COOKIE_CONSENT_SPEC,
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },

    {
      name: "cookie-consent",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: COOKIE_CONSENT_SPEC,
    },
  ],

  webServer: {
    command: process.env.CI ? "pnpm run preview" : "pnpm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
