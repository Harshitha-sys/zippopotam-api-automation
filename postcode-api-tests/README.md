# Zippopotam.us API BDD Automation

BDD test automation for the [Zippopotam.us](https://api.zippopotam.us) postcode
lookup API, written with **Playwright**, **playwright-bdd** and **TypeScript**.

Gherkin scenarios in `features/` are the single source of truth. `playwright-bdd`
compiles them into native Playwright tests and wires them to the step
definitions in `steps/`, so the executable tests are driven by the same
`.feature` file a business reader would review.

## Backlog under test

> As a 3rd party developer I am able to access the API and retrieve postcode
> information for the US and Great Britain only.

## Prerequisites

- Node.js 20.18+ (developed on Node 22/26)
- npm

No browser download is required - these are API-only tests, so
`npx playwright install` is not needed.

## Install

```bash
npm install
```

## Run the tests

```bash
npm test
```

This runs `bddgen && playwright test`: it generates Playwright tests from the
Gherkin features (into `.features-gen/`, which is git-ignored) and then executes
them.

Other useful commands:

```bash
npm run test:ui      # Playwright UI mode (interactive run + watch)
npm run test:debug   # step-through debugging
npm run test:report  # open the last HTML report
npm run typecheck    # tsc --noEmit
npm run bddgen       # regenerate tests from features without running them
```

Filter by tag, e.g. to skip the documented requirements gap:

```bash
npm test -- --grep-invert @requirements-gap
```

## Project structure

```
postcode-api-tests/
├── features/
│   └── postcode.feature      # BDD scenarios (Given/When/Then) - the spec
├── steps/
│   ├── fixtures.ts           # shared per-scenario state as a Playwright fixture
│   └── postcode.steps.ts     # step definitions that automate the scenarios
├── src/
│   ├── api/postcodeApi.ts    # thin, reusable API client (no assertions)
│   └── types/postcodeTypes.ts# TypeScript response model
├── playwright.config.ts      # Playwright + playwright-bdd configuration
├── tsconfig.json
└── package.json
```

## What is covered

| # | Scenario (from the feature file)                                | Expectation                  |
|---|-----------------------------------------------------------------|------------------------------|
| 1 | Valid US postcode `us/90210`                                    | 200, United States / US      |
| 2 | Valid GB postcode `gb/AB1`                                      | 200, Great Britain / GB      |
| 3 | Valid GB outward code `gb/SW1A`                                 | 200, Great Britain / GB      |
| 4 | Case-insensitive country code `US/90210`                        | 200, US                      |
| 5 | Response time                                                   | < 5000 ms                    |
| 6 | Non-existent US code `us/00000`                                | 404, JSON body               |
| 7 | Invalid characters `us/@@@@@`                                  | 404, JSON body               |
| 8 | Non-existent GB code `gb/ZZ99 9ZZ`                             | 404, JSON body               |
| 9 | Unknown country code `zz/12345`                                 | 404, JSON body               |
| 10| Missing postcode (`/us/`)                                      | 404, non-JSON (HTML) body    |
| 11| Missing country (`/90210`)                                      | 404, non-JSON (HTML) body    |
| 12| Backlog restriction gap `de/10115` (`@requirements-gap`)        | 200, DE (see note below)     |

Each scenario also asserts the content type and the shape of the places array
(place name, state, latitude and longitude are numeric strings) where relevant.

## Notes for review

- **Country name.** The API returns `"Great Britain"` for GB, not
  `"United Kingdom"`. The tests assert the value the API actually returns.
- **Spaces in GB postcodes.** A full GB postcode such as `SW1A 1AA` resolves to
  a 404 because the dataset only stores the outward code (`SW1A`). The tests
  therefore use outward codes for the positive GB cases and use `ZZ99 9ZZ` as a
  guaranteed non-existent GB postcode for the negative case.
- **"US and GB only" restriction.** The backlog says the API should serve US and
  GB only, but the public service returns data for many other countries (e.g.
  Germany). The `@requirements-gap` scenario asserts the *actual* behaviour
  (Germany returns 200) and documents this as a clarification to raise with the
  product owner, rather than failing the suite against a restriction the public
  API does not enforce. Use `--grep-invert @requirements-gap` to exclude it.
- **Missing path segments.** When a path segment is omitted the API replies
  with a 404 **HTML** error page (content type `text/html`), whereas an
  unresolvable-but-well-formed lookup replies with a 404 **JSON** body (`{}`).
  The suite asserts both the status and the content-type distinction.
- **Parallel-safe state.** The latest response is shared between `When` and
  `Then` steps via a Playwright fixture (`apiState` in `steps/fixtures.ts`),
  not module-level variables, so scenarios stay isolated under
  `fullyParallel`.

## API under test

Base URL: `https://api.zippopotam.us`

Examples:

```
GET /us/90210   -> 200, JSON with Beverly Hills, CA
GET /gb/AB1     -> 200, JSON with multiple places in Scotland
GET /us/00000   -> 404, JSON body {}
GET /us/        -> 404, HTML error page
```
