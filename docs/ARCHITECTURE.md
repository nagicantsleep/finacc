# Architecture

## Stack

- **App:** SvelteKit 2 (`@sveltejs/kit`) + Svelte 4 + Vite 5, Node adapter (`adapter-node`, output `build/`)
- **Entry:** `vite dev` (port 3010) in development; `node build/index.js` in production
- **Database:** PostgreSQL via Sequelize 6 (`pg`). Models live in `models/`; Kit imports them through `$lib/server/db`
- **Auth:** Signed session cookie (`$lib/server/auth`). Guarded in `src/hooks.server.js` (public / user-scope / tenant-scope)
- **Testing:** Mocha (`test/**/*.test.mjs`) against Sequelize + leftover Express helpers, not against the Kit HTTP server

## Project Structure

```text
src/routes/     SvelteKit pages (`+page.svelte`) and API (`+server.js`)
src/hooks.server.js
                Session, tenant, setup redirect, PDF, handleError
src/lib/        UI components, client stores, `$lib/server` domain logic
models/         Sequelize model definitions
migrations/     Sequelize migrations
config/         DB config, env, module list, menu templates
static/         Public assets (was `public/` in the Express tree)
test/           Mocha tests (unit, integration, reporting, simulation)
docs/           Architecture, harness docs, stories
scripts/        Harness CLI helpers

front/          LEGACY Svelte/Routify tree — not used by Kit runtime
routes/         LEGACY Express handlers — not mounted by Kit
views/          LEGACY server templates
libs/           LEGACY shared logic; mocha tests and PDF helpers still import it
bin/            LEGACY Express server entry (`www`) — not the Kit start path
```

## Core Request Flow

```text
HTTP request
  -> SvelteKit (`src/hooks.server.js`)
       public | user-scope | tenant-scope + FiscalYear setup redirect
  -> Page: +page.server.js load / form actions
     API:  src/routes/api/**/+server.js
  -> $lib/server/*  (auth, accounting, reporting, simulation)
  -> Sequelize (models/) -> PostgreSQL
  -> Response (SSR HTML, form result, or JSON)
```

Page reads should prefer `load` over client axios GET. Mutations that are native forms should use `actions` + `enhance`. JSON `/api/*` remains for remaining SPA screens, mocha, and MCP.

SSR first-paint via `load`: journal month, ledger account, trial balance v2, company list (`/company`, `/company/home`, `/company/new`, `/company/entry/:id`), accounts chart (`/accounts`), voucher list/entry (`/voucher`, `/voucher/new`, `/voucher/entry/:id`), transaction list/entry (`/transaction`, `/transaction/new`, `/transaction/entry/:id`), project list/entry (`/project`, `/project/new`, `/project/entry/:id`, `/project/home`, `/project/labels`, `/project/settings/:id`, `/project/summary/:id`), workspace dashboard (`/workspace`, `/workspace/:id`, `/workspace/new`), tenant settings (`/tenant`).

CSRF: Kit origin checks are on (production only). They apply to form POSTs (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`), not to `application/json` API calls.

## Auth (Kit)

| Path | Mechanism |
| --- | --- |
| `POST /login` | Form action → `loginWithPassword` → session cookie → redirect `/workspace` or `/logon` |
| `POST /signup` | Form action → `signupUser` → redirect `/login?registered=1` |
| `POST /api/user/login` | JSON API, same `loginWithPassword` (mocha / MCP) |
| `POST /api/user/signup` | JSON API, same `signupUser` |

## Tenant Lifecycle — 2-Phase Model

Every tenant goes through two distinct phases. The boundary between them is the
**setup wizard** (`POST /api/setup`).

### Phase 1: Bootstrap Shell (signup)

Created automatically during user self-registration (`bootstrapTenantMember` in
`$lib/server/auth/bootstrap.js`). Produces:

| Entity | Count | Notes |
| --- | --- | --- |
| Tenant | 1 | Slug, name, status='active' |
| TenantMember | 1 | Owner, all permissions, isDefault |
| CompanyClass | 8 | Fixed set (domestic/overseas buyers, customers, etc.) |
| Company | 1 | "本社" (headquarters), linked to "自社" CompanyClass |

**Does NOT create:** FiscalYear, AccountClass, Account, AccountRemaining,
SubAccount, SubAccountRemaining, Menus.

After Phase 1, the user has an empty tenant. Navigating to `/workspace` or `/home`
redirects to `/setup` because `FiscalYear.count === 0`.

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

After Phase 2, `FiscalYear.count > 0` and `/workspace` renders the main app.

### Key Invariant

```
FiscalYear.count(tenantId) === 0  →  redirect to /setup
FiscalYear.count(tenantId) > 0   →  render main app
```

### Additional Tenants

When a user is added to an additional tenant (via invitation or admin), that
tenant goes through the same 2-phase lifecycle independently. The setup wizard
is per-tenant; each tenant needs its own FiscalYear/Accounts.

## Dual-tree leftover (blocked deletion)

`front/`, Express `routes/`, and `views/` are **not** imported by `src/`.
They stay in the repo because:

- Mocha tests import `libs/*` (reporting, simulation, bootstrap, ledger)
- `libs/ledger.js`, `libs/init-subsidiary-ledger.js`, `libs/init-explanatory-journal.js` import `front/javascripts/cross-slip.js`
- `routes/api_user.js` still imports `libs/bootstrap.js`

Safe to delete only after tests and PDF helpers are retargeted at `$lib/server` and `$lib/client/cross-slip.js`.

## Translation System

Translations are **system-wide only** in production. The `enrichBilingual`
helper queries `Translations` with `tenantId: null`. `Translation.fetchBatch` is
a utility method; tenant-level override is not wired to any UI or API.

## Observability

The server emits structured error logs with timestamp, URL, method, and stack
trace. Uncaught page errors go through `handleError` in `hooks.server.js` and
render `src/routes/+error.svelte` without leaking stacks. Audit logs are product
records; application logs are operational records.
