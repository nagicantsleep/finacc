# Test Matrix

This file maps product behavior to proof. Evidence is **mandatory** before marking implemented.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented with tests/validation evidence |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

---

## Evidence Types

| Type | Coverage | Command/Location |
| --- | --- | --- |
| Unit | Pure domain/application logic | `test/*.test.mjs` |
| Integration | API contracts, DB integrity, Sequelize hooks | `npm test` |
| E2E | User-visible browser flows | Playwright tests |
| Platform | Shell, Docker, SSR builds | `npm run build`, `npm run build-ssr` |

---

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | User registration & login | no | ✅ | no | no | implemented | `test/accounting-slice.test.mjs` |
| AUTH-002 | Session management | no | ✅ | no | no | implemented | `test/accounting-slice.test.mjs` |
| TENANT-001 | Multi-tenant isolation | no | ✅ | no | no | implemented | `test/accounting-slice.test.mjs` |
| LEDGER-001 | Account CRUD | no | ✅ | no | no | in_progress | `test/accounting-slice.test.mjs` |
| BUILD-001 | Vite SPA build | no | no | no | ✅ | implemented | `dist/` output |
| BUILD-002 | SSR build | no | no | no | ✅ | implemented | `dist-ssr/` output |
| TBD | Add rows when stories created | no | no | no | no | planned | none |

---

## Test Commands

```bash
npm test                    # Integration tests (Mocha + Supertest)
npm run build               # Vite SPA build
npm run build-ssr           # SSR build
npx playwright test         # E2E tests (if configured)
```

---

## Evidence Rules

- A story is **implemented** only when test evidence exists
- Integration tests use Supertest agent pattern for session isolation
- Tenant isolation verified via direct DB queries with unique suffix per test
- Mark `changed` if contract changes after implementation — do not delete rows
