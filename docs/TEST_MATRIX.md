# Test Matrix

This file maps product behavior to proof.

No product behavior has been defined or implemented yet. Do not mark a row
implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | Add rows when story packets are created | no | no | no | no | planned | none |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.

## Running the Tests

The repo exposes five test scripts:

| Script | Scope | Glob |
| --- | --- | --- |
| `npm test` | Legacy umbrella (unit + integration + reporting + simulation) | `test/**/*.test.mjs` |
| `npm run test:unit` | Pure unit + integration suites (no E2E/smoke) | `test/*.test.mjs`, `test/integration/**`, `test/reporting/**`, `test/simulation/**` |
| `npm run test:e2e` | E2E core-flow suite | `test/e2e/flows/**/*.spec.mjs` |
| `npm run test:smoke` | Bilingual + null-account smoke | `test/e2e/smoke/**/*.spec.mjs` |
| `npm run test:all` | Unit + E2E + smoke (in order) | (composed) |

The E2E/smoke specs use the `.spec.mjs` suffix so they are excluded from the
legacy `npm test` glob and must be invoked explicitly. This keeps existing
CI green while letting new specs evolve at their own pace.

All commands run against the same `hieronymus-test` database configured
via `NODE_ENV=test APP_NAME=hieronymus-test` — no separate DB is required
for the new harness.

## E2E / Smoke Coverage

Added in the `e2e-and-bugfix-hardening` epic (Issues #295, #296).

| Flow / Concern | Test spec | Status |
| --- | --- | --- |
| logon → `/api/user` returns the logged-in user | `test/e2e/flows/core-flow.spec.mjs` § 1 | implemented |
| tenant listing & selection | `test/e2e/flows/core-flow.spec.mjs` § 2, 2b | implemented |
| fiscal-year setup (POST `/api/setup`) | `test/e2e/flows/core-flow.spec.mjs` § 3 | implemented |
| chart of accounts (`/api/accounts`) | `test/e2e/flows/core-flow.spec.mjs` § 4 | implemented |
| ledger (`/api/ledger/1/<code>`) | `test/e2e/flows/core-flow.spec.mjs` § 5 | implemented |
| trial balance v2 (`/api/trial-balance?version=2`) | `test/e2e/flows/core-flow.spec.mjs` § 6 | implemented |
| simulation scenarios list (`/api/simulation/scenarios`) | `test/e2e/flows/core-flow.spec.mjs` § 7 | implemented |
| logout & session destruction | `test/e2e/flows/core-flow.spec.mjs` § 8 | implemented |
| SSR `/home` follows redirects to a rendered page | `test/e2e/smoke/bilingual.spec.mjs` § 1 | implemented |
| language-pair selector has no `undefined` / `/` label | `test/e2e/smoke/bilingual.spec.mjs` § 2 | implemented |
| navbar fiscal-year header has no fragmented slash | `test/e2e/smoke/bilingual.spec.mjs` § 3 | implemented |
| null-account 10× hammering on `/api/remaining` | `test/e2e/smoke/null-account.spec.mjs` § 1 | implemented |
| null-account 10× hammering on `/api/account` | `test/e2e/smoke/null-account.spec.mjs` § 2 | implemented |
| null-account 10× hammering on `/api/ledger` | `test/e2e/smoke/null-account.spec.mjs` § 3 | implemented |
| server-alive check after null-account loop | `test/e2e/smoke/null-account.spec.mjs` § 4 | implemented |

### Regression guards

| Bug | What broke | Test that protects it | Status |
| --- | --- | --- | --- |
| #108 | language selector rendered `undefined` / `/` options | `bilingual.spec.mjs` § 2 | implemented |
| #110 | navbar fiscal-year header had fragmented bilingual tokens | `bilingual.spec.mjs` § 3 | implemented |
| #112 | `BilingualText stacked={true}` broke form `<th>` layout | manual + `bilingual-integration.test.mjs` | implemented |
| #138 | `api_remaining` / `api_ledger` / `api_account` crashed on null `account_rec` | `null-account.spec.mjs` § 1–4 | implemented |

### Defensive / null-guard coverage

Routes audited and patched in #138 (null `Account.findOne` guard):

- `routes/api_remaining.js` → `get(/:term/:account)`
- `routes/api_ledger.js` → `get(/:term/:account)`
- `routes/api_account.js` → `get(/:code)`
- `routes/api_changes.js` → `get(/:term/:account)`

The 10-iteration hammering in `null-account.spec.mjs` exercises the first
three. The smoke spec intentionally picks a code (`999999`) that can never
collide with a real Account row, so a passing run proves the null guard
fires on every call and the server process is not reaped.
