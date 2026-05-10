# Issue #3 Design — Invariants, Migration Plan, and `Tenants` / `UserTenants`

## Purpose

This document turns Issue #2 audit findings into an implementation-safe design for:

- `Tenants`
- `UserTenants`
- `User` / `Member` responsibility split
- schema constraints and indexes
- legacy single-tenant migration approach

This is the blueprint for Issue #3.

---

## 1. Domain Invariants

## `User`

A `User` is a global human identity.

`User` owns:

- login identity
- password hash / auth credentials
- global account disable state
- future global preferences such as `preferredLang`

`User` does **not** own:

- tenant-scoped roles
- tenant-scoped permissions
- tenant-local personnel profile fields
- default/current tenant state

### Migration consequence

Current booleans on `User`:

- `accounting`
- `fiscalBrowsing`
- `approvable`
- `administrable`
- `companyManagement`
- `inventoryManagement`
- `personnelManagement`

must be treated as legacy authorization fields and moved to `UserTenants` semantics.

---

## `Tenant`

A `Tenant` is an isolated workspace / organization boundary.

`Tenant` owns:

- tenant identity
- tenant settings
- tenant-scoped business/accounting data boundary

Suggested minimum fields:

- `id`
- `slug`
- `name`
- `status` (`active` / `inactive`)
- `createdAt`
- `updatedAt`

Optional later fields:

- `settings` JSONB
- `ownerUserId` convenience reference
- plan/billing fields

### Invariants

- `slug` must be unique globally
- inactive tenants cannot be entered as current tenant

---

## `UserTenant`

`UserTenant` is the single source of truth for tenant access.

It owns:

- tenant membership
- tenant role
- tenant-scoped permissions
- default tenant marker
- active/suspended membership state

Suggested minimum fields:

- `id`
- `userId`
- `tenantId`
- `role`
- `status`
- `isDefault`
- `createdAt`
- `updatedAt`

### Recommended MVP role model

Use a simple role enum first:

- `owner`
- `admin`
- `member`

### Permission model options

## Option A — role only in MVP

Pros:
- simpler
- lower migration complexity
- cleaner mental model

Cons:
- does not directly preserve current fine-grained booleans

## Option B — role + migrated booleans in MVP

Suggested extra fields:

- `accounting`
- `fiscalBrowsing`
- `approvable`
- `administrable`
- `companyManagement`
- `inventoryManagement`
- `personnelManagement`

Pros:
- easier migration from current code
- smaller first auth refactor

Cons:
- longer-term permission model remains messy

### Recommendation

Use **Option B for MVP migration**, but define `role` as the primary semantic field.

That gives:

- practical compatibility with existing authorization checks
- ability to refactor toward cleaner role/policy logic later

### Required invariants

- unique `(userId, tenantId)`
- at most one default membership per user
- default membership must have `status = active`
- inactive membership cannot be used as current tenant
- last active `owner` in a tenant cannot be removed/deactivated without replacement

---

## `Member`

`Member` is tenant-owned personnel/profile data.

It owns:

- employment/personnel/business profile fields
- display identity inside a tenant
- bank/contact/employment details

It may optionally link to `User`.

### Recommended MVP rules

- add `tenantId` to `Member`
- keep `userId` nullable
- allow `Member` without login account
- allow `User` without `Member`
- at most one `Member` per `(tenantId, userId)` in MVP

### `Member` does not own

- authentication
- default tenant state
- tenant access permissions
- current session tenant

---

## 2. Proposed Schema Changes

## New table: `Tenants`

Suggested columns:

- `id` integer PK
- `slug` string unique not null
- `name` string not null
- `status` string not null default `active`
- `createdAt`
- `updatedAt`

Suggested indexes:

- unique index on `slug`
- index on `status`

---

## New table: `UserTenants`

Suggested columns:

- `id` integer PK
- `userId` integer FK `Users.id`
- `tenantId` integer FK `Tenants.id`
- `role` string not null default `member`
- `status` string not null default `active`
- `isDefault` boolean not null default `false`
- migrated permission booleans for MVP:
  - `accounting`
  - `fiscalBrowsing`
  - `approvable`
  - `administrable`
  - `companyManagement`
  - `inventoryManagement`
  - `personnelManagement`
- `createdAt`
- `updatedAt`

Suggested indexes / constraints:

- unique index on `(userId, tenantId)`
- index on `userId`
- index on `tenantId`
- index on `(userId, isDefault)`
- application-level or DB-level rule for one default membership per user

### Note on one-default rule

If partial unique indexes are easy in the chosen migration style, enforce:

- unique active/default membership per user where `isDefault = true`

If not, enforce in application logic first and add DB hardening later.

---

## Existing table update: `Members`

Add:

- `tenantId` integer FK `Tenants.id`

Recommended new constraints:

- index on `tenantId`
- optional unique index on `(tenantId, userId)` where `userId IS NOT NULL`

---

## Future tenant-owned tables

The following tables will eventually require `tenantId`:

- `FiscalYears`
- `Accounts`
- `SubAccounts`
- `CrossSlips`
- `CrossSlipDetails`
- `AccountRemainings`
- `SubAccountRemainings`
- `Companies`
- `Vouchers`
- `VoucherFiles`
- `Members`
- `Tasks`
- `TransactionDocuments`
- `TransactionDetails`
- `Items`
- `Projects`
- `Documents`
- `Menus`
- related supporting tables as needed

This issue should define the plan, not implement all of them yet.

---

## 3. Legacy Data Migration Plan

## Assumption

Current data is effectively one single-tenant installation.

## Migration strategy

### Phase 1

Create one legacy/default tenant:

- slug: `default`
- name: `Default Tenant` or derived from current company/app name
- status: `active`

### Phase 2

For every existing `User`:

- create a `UserTenant` membership to the default tenant
- set membership status to `active`
- set one membership per user as default
- copy current permission booleans from `User` into `UserTenant`

### Phase 3

For every existing `Member`:

- set `tenantId = defaultTenantId`

### Phase 4

For future tenantized business tables:

- backfill `tenantId = defaultTenantId`
- validate counts
- then enforce `NOT NULL`

### Important rule

Do **not** remove legacy `User` permission booleans in the same step as introducing `UserTenants`.

Recommended sequence:

1. add new membership model
2. populate membership permissions from `User`
3. migrate auth/authorization reads to `UserTenants`
4. only then remove or ignore legacy `User` permission fields

---

## 4. Bootstrap Rules

## Self-registration rule

Every newly self-registered user gets:

1. global `User`
2. owned `Tenant`
3. `UserTenant` membership with:
   - `role = owner`
   - `status = active`
   - `isDefault = true`
   - permission booleans initialized to full owner/admin capability set for MVP

## Transaction rule

User + Tenant + UserTenant creation must be done in one database transaction.

## Idempotency rule

Bootstrap must avoid duplicate tenants/memberships if retried.

### Recommended practical approach

- create user only once by unique identity
- generate deterministic tenant slug candidate
- if transaction retries, detect existing membership/tenant before creating duplicates

## Open policy question

Need product decision before implementation:

- do admin-created users also get personal default tenants automatically?
- do invited users get one automatically?
- or is this behavior only for self-service signup?

Current recommendation:

- **self-service signup: yes**
- **admin-created/invited users: decide later; not required for first MVP**

---

## 5. Session and Current-Tenant Model

## Session storage rule

Session should store only:

- authenticated user identity reference
- `currentTenantId`

Session should **not** be the source of truth for:

- tenant role
- tenant permission booleans
- tenant active/suspended state

## Protected request rule

Every protected tenant-bound request should:

1. load authenticated user
2. load current `UserTenant` by `userId + currentTenantId`
3. verify membership is active
4. verify tenant is active
5. derive permission state from DB-backed membership

## Current tenant resolution order

1. valid `session.currentTenantId`
2. user's active default membership
3. if exactly one active membership exists, use it
4. otherwise require explicit tenant selection

## Stale tenant behavior

If current tenant becomes invalid:

- clear `currentTenantId`
- retry resolution using fallback order
- if no valid tenant exists, block tenant-bound routes

---

## 6. Migration of Existing Authorization Logic

## Current state

Authorization currently depends on:

- `req.session.user.accounting`
- `req.session.user.fiscalBrowsing`
- `req.session.user.approvable`
- `req.session.user.administrable`
- etc.

## Target MVP state

Authorization should depend on:

- current active `UserTenant` membership
- membership permission booleans migrated from `User`
- optionally `role` for broad checks

## Compatibility plan

Transitional helper recommended:

- introduce a membership-based access object in request context
- use that object in place of legacy session user booleans
- migrate route/module checks incrementally

This lowers refactor risk.

---

## 7. Risks

1. **Cross-tenant leaks** if broad tenantization starts before membership/session model is stable
2. **Permission confusion** if some code reads `User` flags and other code reads `UserTenant`
3. **Bootstrap duplication** if transaction/idempotency is not designed upfront
4. **Member confusion** if old code still treats it like auth-linked identity
5. **Constraint gaps** if uniqueness/default rules are left purely implicit

---

## 8. Recommended Deliverables for Issue #3

- schema decision recorded for `Tenants`
- schema decision recorded for `UserTenants`
- schema decision recorded for `Members.tenantId`
- documented invariants and constraints
- documented legacy migration plan
- documented permission migration strategy from `User` to `UserTenant`
- documented bootstrap rules
- documented current-tenant session rules

---

## 9. Recommended Verify Process for Issue #3

- Review this design against Issue #2 audit findings
- Confirm `User` / `UserTenant` / `Member` split is stable enough for implementation
- Confirm legacy migration plan is acceptable
- Confirm bootstrap rules and tenant resolution rules are acceptable
- Use this document as the basis for Issue #4 implementation planning
