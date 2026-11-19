import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin client around the Zippopotam.us postcode lookup API.
 *
 * The API exposes two URL shapes:
 *   - `/<country>/<postcode>`  when a country is provided
 *   - `/<postcode>`            when no country is provided
 *
 * Both path segments are URL-encoded so spaces (e.g. GB postcodes such as
 * `ZZ99 9ZZ`) and reserved characters are handled safely. The client is
 * intentionally free of assertions - those live in the step definitions so the
 * client stays reusable and the BDD layer stays readable.
 */
export class PostcodeApi {
  constructor(private readonly request: APIRequestContext) {}

  async getPostcode(countryCode: string, postcode: string): Promise<APIResponse> {
    const country = encodeURIComponent(countryCode);
    const postalCode = encodeURIComponent(postcode);

    // No country -> request `/<postcode>` (exercises the "missing country" path).
    // Country present but no postcode -> request `/<country>/` (exercises the
    // "missing postcode" path, the trailing slash is preserved).
    const path = country ? `/${country}/${postalCode}` : `/${postalCode}`;

    return this.request.get(path);
  }
}
