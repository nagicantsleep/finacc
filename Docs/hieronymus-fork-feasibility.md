# Hieronymus Fork Feasibility: Multi-Tenant + Multilingual Support

## Scope

This note evaluates whether the active repository, `BeesNestInc/hieronymus`, can be forked and extended with:

1. multi-tenant support
2. dual-language / multilingual display support for:
   - Japanese ↔ English
   - Japanese ↔ Vietnamese
   - Vietnamese ↔ English

## Short Answer

Yes, it is possible.

However:

- **multilingual display** is a manageable but broad refactor
- **multi-tenant support** is a deeper architectural change and should be treated as a platform-level redesign

The codebase is structured enough to support both, but neither feature is currently built into the design.

---

## Current Architecture Summary

The active repository is built around:

- Express
- Sequelize
- PostgreSQL
- Svelte
- Vite
- Passport.js session authentication
- SSR-based printable forms/PDF rendering

Important characteristics of the current design:

- effectively **single-tenant**
- strongly assumes one organization context
- many labels and UI strings are **hardcoded in Japanese**
- some global behavior is driven by file-based config rather than tenant-scoped database settings

---

## 1. Feasibility of Multi-Tenant Support

## Overall Assessment

Possible, but difficult.

This feature affects:

- database schema
- authentication and session handling
- authorization checks
- nearly every Sequelize query
- company/system settings
- setup flow
- admin flow
- forms and reports

This should be implemented before adding large new business features on top of the fork.

## Main Architectural Problem

The current app is designed around one logical company context.

Typical indicators:

- no tenant model
- no `tenantId` across business tables
- one global settings flow
- authentication is not scoped by tenant
- forms and company info assume one organization identity

## Required Data Model Changes

A new **Tenant** concept needs to be added, but `User` should still represent one real human who may access multiple tenants.

### New tables

Suggested core tables:

- `Tenants`
  - `id`
  - `slug`
  - `name`
  - `isActive`
  - optional plan/settings metadata
- `UserTenants`
  - `id`
  - `userId`
  - `tenantId`
  - `role`
  - `isDefault`
  - `isActive`

### Keep Users global

Recommended MVP identity model:

- one `User` = one real human
- one `User` can belong to multiple tenants
- on first registration, create that user's own default tenant
- create a default `UserTenants` membership for that user

### Add `tenantId` to tenant-owned tables

Likely affected model groups include:

- fiscal years / terms
- companies
- accounts / sub-accounts
- journals / slips / ledger-related tables
- vouchers and voucher files
- members
- projects / labels
- tasks
- transaction documents
- items
- document management tables
- menus / sticky notes / user workspace data
- tax rules and related master data

## Authentication / Session Changes

The login flow must know **which tenant context the authenticated human is entering**.

Possible approaches:

1. login as user first, then enter default tenant automatically unless another is chosen
2. tenant slug in login form
3. URL path prefix per tenant
4. subdomain per tenant

For an initial fork, the simplest approach is usually:

- single domain
- authenticate the user globally
- resolve that user's memberships
- enter the user's default tenant automatically, or let the user choose if needed
- store current tenant context in session

This means authentication is no longer modeled as `username + tenantId` lookup on a tenant-owned user row.
Instead, the app should validate the global user identity first and then validate membership in the selected/current tenant.

## Query Scoping Requirement

This is the most important implementation rule.

Every tenant-owned query must be scoped by `tenantId`.

Without that, the app will have cross-tenant data leakage.

That means updating route handlers and model access throughout the application so reads/writes are tenant-aware.

## Global Settings Problem

The app currently has signs of globally scoped company/system configuration.

For true multi-tenancy, those settings must become:

- database-backed
- tenant-specific

Examples include:

- accounting configuration
- rounding rules
- project accounting feature flags
- company identity / issuer details used in forms

## Forms / PDF Impact

Any printable documents or reports that currently assume one company identity must become tenant-aware.

That includes:

- invoices
- receipts
- estimates
- ledgers
- trial balance / reports
- company header information

All form rendering must use tenant-scoped company/profile/settings data.

## Recommended Multi-Tenant Rollout

### Phase A — foundation

- create `Tenants` table
- create `UserTenants` membership table
- keep `Users` global
- update login flow around global user identity + tenant membership
- store current tenant in session
- create owned default tenant for first-time registered users
- create one default tenant for migrated legacy data

### Phase B — data isolation

- add `tenantId` to all core business tables
- backfill existing data into default tenant
- enforce tenant scoping in all API queries

### Phase C — settings migration

- move global company/system settings into DB
- make setup and admin flows tenant-aware

### Phase D — tenant administration

- tenant creation flow
- tenant onboarding / initialization
- super-admin or platform-admin tools if needed

## Main Multi-Tenant Risks

- missed query scoping causing data leaks
- global config assumptions breaking tenant isolation
- setup flow assuming only one initial organization
- reporting/forms accidentally using the wrong tenant identity
- permission model needing tenant boundaries

---

## 2. Feasibility of Multilingual / Dual-Language Support

## Overall Assessment

Very feasible.

This is a broad but conventional i18n effort.

The main work is not framework complexity; it is **string extraction and consistent adoption** across:

- SPA screens
- navigation
- shared constants
- API messages
- forms/PDF templates

## Main Architectural Problem

The current codebase appears to use a large amount of **hardcoded Japanese text** in multiple places, likely including:

- Svelte components
- module/menu definitions
- shared constants and labels
- validation and error messages
- printable forms

This means the work is less about installing an i18n library and more about systematically replacing embedded text with translation keys.

## Recommended i18n Design

### Languages

Start with three base locales:

- `ja`
- `en`
- `vi`

### Message catalogs

Suggested structure:

- `ja.json`
- `en.json`
- `vi.json`

### Translation helper

Introduce one shared translation layer usable by:

- frontend Svelte UI
- server-side route messages
- SSR form components

### User language preference

Add a field on the user profile, such as:

- `preferredLang`

That allows the app to persist language selection per user.

## Areas That Need Translation Refactor

### UI / navigation

All module titles, menu labels, page headings, button text, and descriptions should move to translation keys.

### Shared constants

Lists such as:

- tax class labels
- rounding methods
- bank account type labels
- accounting display categories

should not remain hardcoded.

### Server messages

Validation, login errors, duplicate-name errors, and user-facing API responses should be translatable.

### Forms / PDFs

This is especially important because the app generates printable business documents.

Those templates must support:

- Japanese only
- English only
- Vietnamese only
- bilingual layouts where needed

## Dual-Language Display Strategy

The requested combinations are:

- Japanese-English
- Japanese-Vietnamese
- Vietnamese-English

The cleanest design is to support:

- one **primary display language** per user/session
- optional **secondary language** for document templates and selected screens

That is better than hardcoding pair-specific logic everywhere.

A flexible model could be:

- `primaryLang`
- `secondaryLang` (optional)

This supports all requested combinations without special-casing each pair in code.

## Form / PDF Considerations

For generated documents, you likely need the ability to choose:

- single-language output
- bilingual output

Examples:

- Japanese title with English subtitle
- Vietnamese invoice labels with English support text
- Japanese issuer information with bilingual field labels

The rendering system should receive language settings explicitly so the SSR form layer can render the correct labels.

## Font Considerations

Japanese and Vietnamese require correct Unicode font coverage.

To avoid rendering issues in PDFs:

- use fonts that cover Japanese and Vietnamese well
- ideally self-host the fonts used by the PDF rendering path

This reduces deployment-time surprises.

## Recommended i18n Rollout

### Phase 1 — foundation

- add locale catalog structure
- add translation helper
- add user language preference field
- add frontend language store/context

### Phase 2 — core UI

- translate login/setup/navigation/common components
- replace hardcoded shared labels/constants

### Phase 3 — business screens

- accounting screens
- company/task/project/document screens
- admin screens

### Phase 4 — forms and reports

- invoices
- estimates
- receipts
- ledgers/reports
- bilingual rendering options

### Phase 5 — translation quality review

- terminology review by accounting/domain-aware translators
- especially important for Vietnamese accounting/business vocabulary

## Main Multilingual Risks

- incomplete string extraction leading to mixed-language UI
- accounting terminology translated inconsistently
- PDF/form output not matching on-screen labels
- fallback behavior becoming messy if keys are missing

---

## Recommended Implementation Order

Do **multi-tenant foundation first**, then multilingual support.

Reason:

- multi-tenancy changes data ownership and system boundaries
- i18n mostly changes presentation and message handling
- doing i18n first can create rework if tenant-specific settings and form rendering change later

Recommended order:

1. fork the active repo
2. create tenant model and tenant-scoped auth
3. add tenant isolation across database and APIs
4. migrate global settings to tenant-owned settings
5. stabilize multi-tenant behavior
6. introduce i18n framework and locale catalogs
7. migrate UI strings
8. migrate forms/PDF templates
9. add bilingual document options

---

## Suggested MVP Strategy

If you are developing this yourself, the safest MVP is:

### MVP for multi-tenancy

- one shared database
- `tenantId` on all business tables
- tenant selected at login
- no subdomain complexity initially
- one platform admin mode only if truly needed

### MVP for multilingual support

- Japanese remains default
- English added first
- Vietnamese added second
- bilingual PDFs supported only for the most important forms first

This reduces risk while keeping the roadmap practical.

---

## Final Recommendation

Forking `BeesNestInc/hieronymus` for your own development is realistic.

But you should plan it as a staged engineering program:

- **multi-tenant support** = core platform refactor
- **multilingual support** = broad product/UI refactor

If executed in phases, the project is feasible.

If rushed without strong schema and isolation discipline, the multi-tenant part becomes the main danger.

The best next step is to produce a **codebase-specific implementation roadmap** with:

- tables/models to change
- route groups to update
- session/auth redesign details
- i18n extraction targets
- migration order
- test strategy
