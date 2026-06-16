# Architecture

## Stack

- **Frontend:** Svelte 4 + Vite 5 (SSR via `vite.config.ssr.js`, routing via `@roxi/routify`)
- **Backend:** Express 4 (ESM)
- **Database:** PostgreSQL via Sequelize 6 (`pg`, `connect-pg-simple` for sessions)
- **Auth:** Passport local strategy
- **Testing:** Mocha + Supertest (unit, integration, E2E/smoke)

## Project Structure

```text
front/          Svelte components and client JS
views/          Server-rendered templates (.spy, .ejs)
routes/         Express route handlers (api_*.js, home.js, forms.js)
models/         Sequelize model definitions
migrations/     Sequelize migrations
config/         DB config, env, module list, menu templates
libs/           Shared business logic (auth, reporting, simulation, bootstrap)
bin/            Server entry (www), check-db, check-config
public/         Static assets
test/           Mocha tests (unit, integration, reporting, simulation, e2e)
  helpers/      Test utilities (createTestTenant.mjs)
docs/           Architecture, harness docs, stories
scripts/        Harness CLI
```

## Core Request Flow

```text
HTTP request
  -> Express route (routes/)
  -> Middleware (auth, tenant guard)
  -> Route handler
  -> Sequelize model (models/)
  -> PostgreSQL
  -> Response (JSON or SSR render)
```

## Tenant Lifecycle — 2-Phase Model

Every tenant goes through two distinct phases. The boundary between them is the
**setup wizard** (`POST /api/setup`).

### Phase 1: Bootstrap Shell (signup)

Created automatically during user self-registration (`bootstrapTenantMember` in
`libs/bootstrap.js`). Produces:

| Entity | Count | Notes |
| --- | --- | --- |
| Tenant | 1 | Slug, name, status='active' |
| TenantMember | 1 | Owner, all permissions, isDefault |
| CompanyClass | 8 | Fixed set (domestic/overseas buyers, customers, etc.) |
| Company | 1 | "本社" (headquarters), linked to "自社" CompanyClass |

**Does NOT create:** FiscalYear, AccountClass, Account, AccountRemaining,
SubAccount, SubAccountRemaining, Menus.

After Phase 1, the user has an empty tenant. Navigating to `/home` redirects
to `/setup` because `FiscalYear.count === 0`.

### Phase 2: Setup Wizard (first-time setup)

Triggered by `POST /api/setup` from the `/setup` page. Creates the accounting
baseline:

| Entity | Notes |
| --- | --- |
| FiscalYear | User-selected start/end dates, term, year |
| AccountClass | From `parse_accounts.js` based on companyClass |
| Account | Full chart of accounts |
| AccountRemaining | Per-account, per-term balances |
| SubAccount | Sub-accounts where applicable |
| SubAccountRemaining | Sub-account balances |
| Menu templates | From `config/menu-template.cjs` |
| Company | Updated with roundingMethod |

After Phase 2, `FiscalYear.count > 0` and `/home` renders the main app.

### Key Invariant

```
FiscalYear.count(tenantId) === 0  →  redirect to /setup
FiscalYear.count(tenantId) > 0   →  render main app
```

### Additional Tenants

When a user is added to an additional tenant (via invitation or admin), that
tenant goes through the same 2-phase lifecycle independently. The setup wizard
is per-tenant; each tenant needs its own FiscalYear/Accounts.

## Translation System

Translations are **system-wide only** in production. The `enrichBilingual`
helper queries `Translations` with `tenantId: null`. `Translation.fetchBatch` is
a utility method; tenant-level override is not wired to any UI or API.

## Observability

The server emits structured error logs with timestamp, URL, method, and stack
trace. Audit logs are product records; application logs are operational records.
