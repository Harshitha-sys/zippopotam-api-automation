/**
 * Response model for the Zippopotam.us postcode lookup API.
 *
 * Example response for `GET /us/90210`:
 * {
 *   "country": "United States",
 *   "country abbreviation": "US",
 *   "post code": "90210",
 *   "places": [
 *     {
 *       "place name": "Beverly Hills",
 *       "longitude": "-118.4065",
 *       "latitude": "34.0901",
 *       "state": "California",
 *       "state abbreviation": "CA"
 *     }
 *   ]
 * }
 */

export interface Place {
  'place name': string;
  longitude: string;
  state: string;
  'state abbreviation': string;
  latitude: string;
}

export interface PostcodeResponse {
  'post code': string;
  country: string;
  'country abbreviation': string;
  places: Place[];
}
