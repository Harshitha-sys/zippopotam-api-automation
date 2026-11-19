import { test as base, createBdd } from 'playwright-bdd';
import type { APIResponse } from '@playwright/test';

/**
 * Per-scenario container that carries the latest API response and the values
 * derived from it between `When` and `Then` steps.
 *
 * Defining it as a Playwright fixture (instead of module-level variables)
 * keeps scenarios isolated from each other and safe to run in parallel.
 */
export interface ApiState {
  response: APIResponse | null;
  status: number;
  contentType: string;
  body: unknown;
  responseTimeMs: number;
}

type Fixtures = {
  apiState: ApiState;
};

export const test = base.extend<Fixtures>({
  apiState: async ({}, use) => {
    await use({
      response: null,
      status: 0,
      contentType: '',
      body: null,
      responseTimeMs: 0,
    });
  },
});

export const { Given, When, Then } = createBdd(test);
