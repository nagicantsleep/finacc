# Hieronymus Fork Roadmap

## Goal

Build a fork of `BeesNestInc/hieronymus` that supports:

1. multi-tenant operation
2. multilingual UI and document output
   - Japanese
   - English
   - Vietnamese
   - optional bilingual document rendering

---

## High-Level Strategy

Implement in this order:

1. fork + baseline stabilization
2. multi-tenant foundation
3. tenant-safe data isolation
4. tenant settings migration
5. i18n foundation
6. UI translation rollout
7. forms/PDF bilingual rollout
8. hardening, tests, deployment

Reason: multi-tenancy changes the platform boundaries; i18n is easier and safer once those boundaries are stable.

---

## Phase 0 — Fork and Baseline

## Objectives

- fork the active repo
- pin a working baseline
- verify local development and database setup
- document current architecture before changes

## Deliverables

- your fork created
- branch strategy defined
- baseline app running locally
- test/staging database prepared
- initial architecture notes

## Tasks

- fork `BeesNestInc/hieronymus`
- clone your fork
- run install/build/migrate/start workflow
- confirm main accounting flows work
- capture current models, routes, and form-generation flow
- decide deployment target for your fork

---

## Phase 1 — Multi-Tenant Foundation

## Objectives

Introduce tenant identity and user-to-tenant membership into the platform.

## Deliverables

- `Tenants` table
- `UserTenants` membership table
- global `Users` model retained for real human identities
- tenant-aware login/session flow with current tenant context
- first registered user receives an owned default tenant
- migrated legacy data attached to one default tenant

## Tasks

### Data model

Create:

- `Tenants`
  - `id`
  - `slug`
  - `name`
  - `isActive`
  - optional settings/plan metadata
- `UserTenants`
  - `id`
  - `userId`
  - `tenantId`
  - `role`
  - tenant-scoped permission fields migrated from `User`
  - `isDefault`
  - `isActive`

Keep `Users` global:

- one `User` represents one real human
- a `User` can belong to multiple tenants
- `User` stores authentication-related identity
- later add `preferredLang` to `Users`

Treat `Members` as tenant-owned:

- personnel/profile/employment data inside a tenant
- may link to a global `User`
- should not own tenant access permissions
- should not own default-tenant/session state

### Auth/session

- decide whether login chooses tenant explicitly or resolves the user's default tenant first
- authenticate the human user globally
- resolve allowed tenant memberships for that user
- store current `tenantId` in session
- ensure permission checks read tenant-scoped session state
- support switching current tenant among the user's memberships

### Registration/bootstrap

- on first user registration, create that user's own tenant
- create a `UserTenants` membership linking the user to the tenant
- mark that membership as default
- assign tenant-admin level permissions/role for that first membership

### Migration

- create one default tenant for migrated legacy data
- create membership records linking existing users to that default tenant
- mark an appropriate default membership for each migrated user

---

## Phase 2 — Tenant Data Isolation

## Objectives

Ensure all business data belongs to a tenant and all queries are tenant-scoped.

## Deliverables

- `tenantId` added to all tenant-owned tables
- backend middleware exposes current tenant context
- all API routes read/write within tenant scope only

## Likely Affected Data Areas

- fiscal years / terms
- companies
- accounts / sub-accounts
- slips / journal / ledger tables
- vouchers / voucher files
- members
- projects / labels
- tasks
- transaction documents
- items
- document management
- menu/dashboard state
- tax rules
- sticky/workspace data

## Tasks

- add `tenantId` columns in additive migrations
- backfill all existing rows to default tenant
- make `tenantId` non-null after backfill
- update all Sequelize queries to include tenant scope
- review associations for tenant-safe access patterns
- verify reports/forms do not read unscoped data

## Exit Criteria

- no cross-tenant reads
- no cross-tenant writes
- users only see data from their own tenant

---

## Phase 3 — Tenant Settings and Company Identity

## Objectives

Replace global settings assumptions with tenant-specific settings.

## Deliverables

- tenant-scoped settings storage
- tenant-scoped company identity for invoices/forms/reports
- tenant-aware setup flow

## Tasks

- move file/global settings into database-backed tenant settings
- migrate accounting settings per tenant
- make company profile / issuer info tenant-specific
- update setup screens to initialize per tenant
- update admin/settings screens accordingly

## Risks Addressed

- wrong company header on forms
- one tenant changing settings for all others
- setup flow assuming single organization forever

---

## Phase 4 — Tenant Administration

## Objectives

Allow managed creation and lifecycle of tenants.

## Deliverables

- tenant creation flow
- tenant onboarding flow
- optional platform admin UI

## Tasks

- create tenant bootstrap process
- seed default records per tenant
- create initial admin user per tenant
- define whether you need:
  - self-service tenant signup
  - internal-only tenant provisioning
  - platform super-admin dashboard

## Recommendation

For MVP, keep provisioning internal/admin-only. Avoid self-service until tenant isolation is proven stable.

---

## Phase 5 — i18n Foundation

## Objectives

Introduce a clean translation system for UI, API messages, and SSR forms.

## Deliverables

- locale catalogs
- translation helper
- frontend language state/store
- user language preference

## Suggested Locales

- `ja`
- `en`
- `vi`

## Tasks

- add locale files:
  - `ja.json`
  - `en.json`
  - `vi.json`
- implement shared translation helper
- add `preferredLang` to user model
- initialize frontend language from user/session
- define fallback strategy: `requested -> ja -> key`

---

## Phase 6 — UI Translation Rollout

## Objectives

Remove hardcoded Japanese from the SPA and navigation.

## Deliverables

- translated common UI
- translated menus/modules
- translated accounting screens
- translated admin/setup screens

## Translation Targets

- login screens
- setup flow
- navigation/module metadata
- common buttons, labels, dialogs
- shared constants and lookup labels
- validation and user-facing API messages
- accounting screens
- CRM/project/document screens
- admin/settings screens

## Rollout Order

1. login + common layout
2. navigation + shared constants
3. core accounting screens
4. secondary business modules
5. admin/setup screens

## Recommendation

Do English first, then Vietnamese.

---

## Phase 7 — Forms / PDF / Bilingual Output

## Objectives

Support localized and bilingual printable business documents and reports.

## Deliverables

- translated form templates
- language-aware SSR render path
- bilingual output option for major forms

## Priority Documents

- invoice
- estimate
- receipt
- ledger/report headers
- trial balance / financial statements

## Tasks

- pass language context into SSR form rendering
- replace hardcoded form labels with translation keys
- support primary + secondary language display where required
- ensure fonts support Japanese, English, and Vietnamese
- verify PDF rendering in deployed environment

## Recommendation

Start with:

- single-language JA/EN
- then JA/VI
- then optional bilingual documents

---

## Phase 8 — Testing and Hardening

## Objectives

Prove tenant isolation and translation completeness.

## Deliverables

- tenant isolation tests
- language-switching tests
- PDF rendering verification
- migration validation

## Test Areas

### Multi-tenant

- login by tenant
- same username in different tenants
- tenant-specific reports
- tenant-specific settings
- no cross-tenant API leakage

### i18n

- user language persistence
- fallback behavior
- mixed-language regression scan
- translated validation messages
- translated PDF labels

### Migration

- existing single-tenant data moved to default tenant safely
- setup works for newly created tenants
- reports still produce correct totals after scoping

---

## Suggested MVP Scope

## MVP Multi-Tenant

- shared database
- row-level tenant isolation with `tenantId`
- tenant selected at login
- internal tenant provisioning only
- one deployment environment

## MVP i18n

- default Japanese
- English support for major UI flows
- Vietnamese support after English stabilizes
- bilingual output only for invoice/estimate initially

This is the safest first release.

---

## Major Risks

## 1. Data leakage

Missing tenant filters in just one query can expose one tenant’s data to another.

## 2. Global config leftovers

Any remaining global settings path can silently break tenant separation.

## 3. Translation inconsistency

Mixed hardcoded text and translated text will create an unprofessional UX.

## 4. Accounting terminology quality

Japanese accounting terms need careful English/Vietnamese equivalents.

## 5. PDF font/rendering issues

Vietnamese diacritics and Japanese text must both render correctly in headless PDF generation.

---

## Recommended Teaming

If you are doing this mostly yourself, work in this rhythm:

1. schema + auth changes
2. one module at a time for tenant isolation
3. one language at a time for i18n
4. forms last

If you have help, split work by:

- backend tenancy
- frontend i18n
- forms/PDF localization
- test automation

---

## Practical Next Step

Start with a technical design package containing:

- migration list
- models to modify
- routes to audit
- settings migration plan
- i18n key structure
- first 3 features to convert end-to-end

Recommended first end-to-end slice:

1. login
2. company/settings
3. invoice flow

That slice touches auth, tenant context, i18n, and PDF output, giving early proof that the architecture works.
