# Zippopotam.us API — BDD Test Automation

Behavior-Driven Development (BDD) test automation for the public postcode
lookup API at [api.zippopotam.us](https://api.zippopotam.us), built with
**Playwright**, **playwright-bdd** and **TypeScript**.

The Gherkin scenarios in `features/postcode.feature` are the single source of
truth: `playwright-bdd` compiles them into native Playwright tests and wires
them to the step definitions in `steps/`, so the executable tests are driven by
the same `.feature` file a business reader would review.

> **Backlog item under test:** *As a 3rd party developer I am able to access the
> API and retrieve postcode information for the US and Great Britain only.*

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | 20.18 or newer (Node 22 LTS recommended). Check with `node -v`. |
| **npm** | Ships with Node. Check with `npm -v`. |
| **Internet access** | The tests run against the live public API at `https://api.zippopotam.us`. |

> **No browser download is required.** These are API-only tests, so
> `npx playwright install` is **not** needed.

---

## Quick start — clone & run

```bash
# 1. Clone the repository
git clone <repo-url> zippopotam-api-automation
cd zippopotam-api-automation

# 2. The runnable project lives in the postcode-api-tests subfolder
cd postcode-api-tests

# 3. Install dependencies
npm install

# 4. Run the tests
npm test
```
---

## How it works

```
features/postcode.feature   ──bddgen──▶   .features-gen/*.spec.js   ──playwright test──▶   results
       (Gherkin)                              (generated Playwright tests)                  (12 passed)
```

The latest API response is shared between `When` and `Then` steps via a
Playwright fixture (`apiState` in `steps/fixtures.ts`), not module-level
variables, so scenarios stay isolated under `fullyParallel`.

---

## Project structure

```
zippopotam-api-automation/
└── postcode-api-tests/            # the runnable project (run npm commands here)
    ├── features/
    │   └── postcode.feature       # BDD scenarios (Given/When/Then) — the spec
    ├── steps/
    │   ├── fixtures.ts            # shared per-scenario state (Playwright fixture)
    │   └── postcode.steps.ts      # step definitions that automate the scenarios
    ├── src/
    │   ├── api/postcodeApi.ts     # thin, reusable API client (no assertions)
    │   └── types/postcodeTypes.ts # TypeScript response model
    ├── playwright.config.ts       # Playwright + playwright-bdd configuration
    ├── tsconfig.json
    ├── package.json
    └── README.md                  # deeper per-project notes & full coverage table
```

---

## What is covered (12 scenarios)

| # | Scenario | Expectation |
|---|----------|-------------|
| 1 | Valid US postcode `us/90210` | 200, United States / US, places with name/state/lat+long |
| 2 | Valid GB postcode `gb/AB1` | 200, Great Britain / GB |
| 3 | Valid GB outward code `gb/SW1A` | 200, Great Britain / GB |
| 4 | Case-insensitive country code `US/90210` | 200, US |
| 5 | Response time | 200 in < 5000 ms |
| 6 | Non-existent US code `us/00000` | 404, JSON body |
| 7 | Invalid characters `us/@@@@@` | 404, JSON body |
| 8 | Non-existent GB code `gb/ZZ99 9ZZ` | 404, JSON body |
| 9 | Unknown country code `zz/12345` | 404, JSON body |
| 10 | Missing postcode (`/us/`) | 404, non-JSON (HTML) body |
| 11 | Missing country (`/90210`) | 404, non-JSON (HTML) body |
| 12 | Backlog restriction gap `de/10115` (`@requirements-gap`) | 200, DE (see notes) |

---

## Review

- **Country name.** The API returns `"Great Britain"` for GB, **not**
  `"United Kingdom"`. The tests assert the value the API actually returns.
- **Spaces in GB postcodes.** A full GB postcode such as `SW1A 1AA` resolves to a
  404 because the dataset only stores the outward code (`SW1A`). The tests use
  outward codes for the positive GB cases and `ZZ99 9ZZ` as a guaranteed
  non-existent GB postcode for the negative case.
- **"US and GB only" restriction.** The backlog says the API should serve US and
  GB only, but the public service returns data for many other countries (e.g.
  Germany). The `@requirements-gap` scenario asserts the *actual* behaviour
  (Germany returns 200) and documents this as a clarification to raise with the
  product owner, rather than failing the suite against a restriction the public
  API does not enforce.
- **Missing path segments.** Omitting a path segment yields a 404 **HTML**
  error page (`text/html`), whereas an unresolvable-but-well-formed lookup
  yields a 404 **JSON** body (`{}`). The suite asserts both the status and the
  content-type distinction.
- **Live API.** Tests hit the real public API, so an internet connection is
  required. Retries are configured (1 locally, 2 in CI) to absorb transient
  network hiccups.

---

## Troubleshooting

- **Tests fail with network/timeout errors.** Re-run `npm test`. The public API
  is occasionally slow or rate-limited; the suite retries automatically but a
  re-run clears most transient failures.
- **`bddgen: command not found`.** Run from inside `postcode-api-tests/` and
  run `npm install` first — `bddgen` comes from the `playwright-bdd` dependency.
- **`process`/type errors after an edit.** Run `npm run typecheck` to surface
  TypeScript issues.
- **Want to skip the documented gap scenario.**
  `npm test -- --grep-invert @requirements-gap`.

---
