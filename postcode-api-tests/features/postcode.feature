Feature: Retrieve postcode information

  As a third-party developer
  I want to retrieve postcode information
  So that I can obtain geographical details for postcodes in the US and Great Britain.

  The Zippopotam API (https://api.zippopotam.us) serves JSON for the URL pattern
  /<country>/<postcode>. The development backlog restricts the supported
  countries to the US ("us") and Great Britain ("gb").

  Background:
    Given the Zippopotam API is available

  # --- Happy path: supported countries -------------------------------------

  Scenario Outline: Retrieve a valid postcode for a supported country
    When I request postcode "<postcode>" for country "<country>"
    Then the response status should be 200
    And the response content type should be JSON
    And the country in the response should be "<countryName>"
    And the country abbreviation should be "<countryAbbrev>"
    And the post code in the response should be "<postcode>"
    And the response should contain a non-empty list of places
    And each place should have a place name, state, latitude and longitude

    Examples:
      | country | postcode | countryName   | countryAbbrev |
      | us      | 90210    | United States | US            |
      | gb      | AB1      | Great Britain | GB            |
      | gb      | SW1A     | Great Britain | GB            |

  Scenario: Country code lookup is case-insensitive
    When I request postcode "90210" for country "US"
    Then the response status should be 200
    And the country abbreviation should be "US"
    And the post code in the response should be "90210"

  Scenario: The API responds within an acceptable time
    When I request postcode "90210" for country "us"
    Then the response status should be 200
    And the response time should be less than 5000 milliseconds

  # --- Failure path --------------------------------------------------------

  Scenario Outline: A lookup that cannot be resolved returns 404 with a JSON body
    When I request postcode "<postcode>" for country "<country>"
    Then the response status should be 404
    And the response content type should be JSON

    Examples:
      | country | postcode | reason                |
      | us      | 00000    | non-existent US code   |
      | us      | @@@@@    | invalid characters     |
      | gb      | ZZ99 9ZZ | non-existent GB code   |
      | zz      | 12345    | unknown country code   |

  Scenario Outline: A request missing a required path segment returns 404 with a non-JSON body
    When I request postcode "<postcode>" for country "<country>"
    Then the response status should be 404
    And the response content type should not be JSON

    Examples:
      | country | postcode | reason          |
      | us      |          | missing postcode |
      |         | 90210    | missing country  |

  # --- Requirements gap (documented, not a defect of this API) --------------

  @requirements-gap
  Scenario: The public API does not enforce the "US and Great Britain only" backlog restriction
    # The backlog states the API should serve US and GB only. The public service
    # at api.zippopotam.us currently returns data for other countries (e.g.
    # Germany). This scenario asserts the actual behaviour and flags a
    # clarification with the product owner rather than failing the suite.
    When I request postcode "10115" for country "de"
    Then the response status should be 200
    And the country abbreviation should be "DE"
