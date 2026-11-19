import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Playwright-BDD turns the Gherkin files in `features/` into native Playwright
 * tests (written to `.features-gen/`) and wires them to the step definitions in
 * `steps/`. `testDir` is set to that generated directory by `defineBddConfig`.
 */
const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.ts',
});

export default defineConfig({
  testDir,

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  // A public, third-party API can be flaky, so retry once locally and twice in CI.
  retries: process.env.CI ? 2 : 1,

  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: 'https://api.zippopotam.us',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    trace: 'retain-on-failure',
  },
});
