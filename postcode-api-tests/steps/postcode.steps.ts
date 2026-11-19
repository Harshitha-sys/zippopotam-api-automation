import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import type { ApiState } from './fixtures';
import { PostcodeApi } from '../src/api/postcodeApi';
import type { PostcodeResponse } from '../src/types/postcodeTypes';

/** Parses the response body as JSON, returning null for non-JSON bodies. */
async function safeJson(response: APIResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // The API returns an HTML error page for some 404s (e.g. a missing path
    // segment). Those bodies are not valid JSON, so treat them as "no body".
    return null;
  }
}

/** Returns the parsed JSON body as a typed postcode response, asserting it is present. */
function postcodeBody(apiState: ApiState): PostcodeResponse {
  expect(apiState.body, 'response body should be JSON').toBeTruthy();
  return apiState.body as PostcodeResponse;
}

Given('the Zippopotam API is available', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok(), 'Zippopotam API should be reachable').toBeTruthy();
});

When(
  'I request postcode {string} for country {string}',
  async ({ request, apiState }, postcode: string, country: string) => {
    const api = new PostcodeApi(request);
    const startedAt = Date.now();
    const response = await api.getPostcode(country, postcode);
    apiState.responseTimeMs = Date.now() - startedAt;
    apiState.response = response;
    apiState.status = response.status();
    apiState.contentType = response.headers()['content-type'] ?? '';
    apiState.body = await safeJson(response);
  },
);

Then('the response status should be {int}', async ({ apiState }, expected: number) => {
  expect(apiState.status).toBe(expected);
});

Then('the response content type should be JSON', async ({ apiState }) => {
  expect(apiState.contentType).toContain('application/json');
});

Then('the response content type should not be JSON', async ({ apiState }) => {
  expect(apiState.contentType).not.toContain('application/json');
});

Then('the country in the response should be {string}', async ({ apiState }, countryName: string) => {
  expect(postcodeBody(apiState).country).toBe(countryName);
});

Then('the country abbreviation should be {string}', async ({ apiState }, abbrev: string) => {
  expect(postcodeBody(apiState)['country abbreviation']).toBe(abbrev);
});

Then('the post code in the response should be {string}', async ({ apiState }, postcode: string) => {
  expect(postcodeBody(apiState)['post code']).toBe(postcode);
});

Then('the response should contain a non-empty list of places', async ({ apiState }) => {
  const body = postcodeBody(apiState);
  expect(Array.isArray(body.places)).toBeTruthy();
  expect(body.places.length).toBeGreaterThan(0);
});

Then(
  'each place should have a place name, state, latitude and longitude',
  async ({ apiState }) => {
    const body = postcodeBody(apiState);
    expect(body.places.length).toBeGreaterThan(0);
    for (const place of body.places) {
      expect(place['place name'], 'place name').toBeTruthy();
      expect(place.state, 'state').toBeTruthy();
      expect(place.latitude, 'latitude').toMatch(/^-?\d+(\.\d+)?$/);
      expect(place.longitude, 'longitude').toMatch(/^-?\d+(\.\d+)?$/);
    }
  },
);

Then('the response time should be less than {int} milliseconds', async ({ apiState }, ms: number) => {
  expect(apiState.responseTimeMs).toBeLessThan(ms);
});
