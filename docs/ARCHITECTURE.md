# Architecture

> **Stack:** Express.js 4.x · Svelte 4.x + Routify 2.x · Vite 5.x · PostgreSQL + Sequelize 6.x · Passport.js · EJS + Sprightly

This document defines the architectural boundaries, layering rules, and patterns
specific to this project.

---

## Project Structure

```
fin-acc/
├── bin/               # Entry point (www)
├── config/            # DB config, env, module-list
├── front/             # Frontend assets
│   ├── javascripts/   # Plain JS utilities
│   ├── stylesheets/   # CSS
│   └── svelte/       # Svelte components (main UI)
├── libs/              # Backend utilities
│   ├── user.js        # is_authenticated
│   ├── tenant.js      # requireTenant
│   └── *.js           # Ledger, trial_balance, etc.
├── models/            # Sequelize models (35+ models)
│   └── index.js       # Model registry
├── routes/            # API routes (25+ files)
│   ├── api*.js        # API endpoints
│   └── *.js           # Page routes
├── migrations/        # Sequelize migrations
├── test/              # Integration tests (*.test.mjs)
├── views/             # EJS/Sprightly templates (.spy)
├── app.js             # Express app entry
└── package.json
```

---

## Layering

```
interface层 (routes/)
    ↓
libs层 (utilities)
    ↓
models层 (Sequelize ORM)
    ↓
database (PostgreSQL)
```

---

## Multi-Tenant Pattern

**All models include `tenantId` column.**

| Middleware | Purpose |
|------------|---------|
| `is_authenticated` | Verify session user exists |
| `requireTenant` | Ensure request has valid tenant context |

Auth layers:
```
Public    → /login, /signup, /api/user/login, /api/user/signup
User-scope → /logon, /api/user/password, /api/user/profile
Tenant-scope → All business routes (/, /home, /api/* except auth)
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| API routes | `api_*.js` | `routes/api_account.js` |
| Models | PascalCase singular | `CrossSlip`, `FiscalYear` |
| Svelte components | kebab-case | `journal-entry.svelte` |
| Migrations | `YYYYMMDDHHMMSS-*.js` | `20240501000000-create-account.js` |

---

## Parse-First Boundary Rule

Unknown data must be parsed at boundaries before it enters inner code.

```
unknown input → parser → typed DTO → application logic → domain object
```

---

## Command/Query Separation

- **Commands** (`routes/api_*.js`): POST/PUT/DELETE — mutate state, own audit side effects
- **Queries** (`routes/api_*.js`): GET — read state, format for consumers
- **Shared rules** live in `libs/` or `models/`, not in routes

---

## Observability Contract

Canonical JSON log per request:
```
{timestamp, level, request_id, user_id?, action, duration_ms, status_code, message}
```

Audit logs ≠ application logs. Do not substitute one for the other.
