# Epic 1 — Multi-tenant Foundation

## Epic Goal

Build the first production-ready multi-tenant foundation for this Hieronymus fork.

The target model is:

- one **User** represents one real human
- one **User** can access **multiple tenants**
- when a user is first registered/created, the system creates that user's **own tenant** as the default tenant
- the user receives a default membership in that tenant
- all tenant-owned business data is isolated by tenant
- each session has one active **current tenant** context

This epic is the platform foundation for all future work, including multilingual support.

---

## Product Model

## User

A `User` is a real human identity.

Properties:

- global identity
- can belong to multiple tenants
- stores authentication-related identity data
- may later have personal preferences such as `preferredLang`
- must not own tenant-scoped permissions
- should not own tenant-scoped business/profile fields

## Tenant

A `Tenant` is an independent workspace / organization boundary.

Properties:

- isolated business/accounting data
- isolated company identity and settings
- isolated permission boundary

## Membership

A `UserTenant` membership connects a human user to a tenant.

Suggested fields:

- `userId`
- `tenantId`
- `role`
- tenant-scoped permission fields migrated from `User`
- `isDefault`
- `status`

This table becomes the basis for:

- tenant access
- default tenant selection
- tenant switching
- tenant-scoped permissions
- tenant-level admin/owner role assignment

Required invariants:

- unique `(userId, tenantId)`
- at most one default membership per user
- default membership must be active
- last active tenant owner cannot be removed or deactivated

Recommended MVP role model:

- `owner`
- `admin`
- `member`

## Member

A `Member` is tenant-owned personnel/profile data, not authentication state.

Suggested role in the new model:

- optional tenant-local profile for a human user
- employment/personnel/business identity inside a tenant
- may link to global `User`
- `Member.userId` may be nullable for non-login personnel records
- recommended MVP cardinality: at most one `Member` per `(tenantId, userId)`
- does not own auth/session/default-tenant state
- does not own tenant access permissions

---

## Scope

Included in this epic:

- tenant domain model
- membership model
- tenant-aware auth/session design
- tenant context middleware/helpers
- tenant-owned settings/company identity
- first end-to-end proof flow
- isolation rules for implemented modules
- tenant isolation tests for implemented scope

Not included in this epic:

- i18n / multilingual UI
- billing/subscriptions
- self-service signup beyond first-user bootstrap
- SSO/OAuth
- theming/branding system
- separate DB/schema per tenant

---

## MVP Decisions

### Identity model

Use:

- global `Users`
- `Tenants`
- `UserTenants`
- tenant-owned `Members`

Do **not** use `Users.tenantId` as the primary model.
Do **not** keep tenant permission flags on `Users` long term.
They should move to `UserTenants` as membership-scoped permissions/roles.

### Tenant selection model

MVP behavior:

- authenticate user as a human identity
- resolve memberships for that user
- session stores only the current `tenantId`
- protected requests re-validate current membership from the database
- enter the default tenant automatically when appropriate
- allow switching current tenant later

Recommended current-tenant resolution order:

1. valid `session.currentTenantId`
2. user's active default membership
3. if exactly one active membership exists, use it
4. otherwise require explicit tenant selection

Stale/invalid current-tenant behavior:

- if membership was revoked, tenant deactivated, or current tenant is invalid, clear the current tenant from session
- retry tenant resolution using the fallback order above
- if no active membership exists, block tenant-bound routes and show no accessible tenant state

### Data isolation model

Use:

- shared PostgreSQL database
- shared schema
- `tenantId` on tenant-owned tables

### First registration/bootstrap model

Explicit MVP rule:

- every newly self-registered user gets a personal default tenant and an active owner membership

On first user registration/creation:

1. create the user
2. create that user’s own tenant
3. create a membership linking the user to that tenant
4. mark that membership as default
5. assign owner role in that tenant

Bootstrap requirements:

- creation of user + tenant + membership must be one database transaction
- bootstrap must be idempotent under retry
- duplicate default tenants/memberships must be prevented
- tenant naming/slug strategy must be defined before implementation

Open policy question to resolve before implementation:

- whether admin-created users and invited users also receive an automatic personal default tenant, or only self-registered users do

---

## Acceptance Criteria

- [ ] `Tenants` model/table exists
- [ ] `UserTenants` membership model/table exists
- [ ] `Users` remain global human identities
- [ ] tenant-scoped permission/role data is moved out of `Users` design and into `UserTenants`
- [ ] `Members` are treated as tenant-owned personnel/profile records, not auth state
- [ ] first registered self-service user gets an owned default tenant and active owner membership
- [ ] bootstrap flow is transactional and idempotent
- [ ] authenticated sessions carry only current tenant context and re-validate membership from the database
- [ ] tenant-owned settings/company identity are no longer global
- [ ] one validated proof flow works across two tenants without leakage
- [ ] legacy single-tenant data migration path is defined before broad tenantization
- [ ] tests cover tenant identity, membership resolution, session fallback behavior, and implemented isolation rules

---

## Epic Work Breakdown

## Issue 1 — Audit auth/session/settings/company identity assumptions (#2)

### Description & Requirements

Audit the current codebase and identify every place where the application assumes a single global organization.

Focus areas:

- authentication flow
- session flow
- current user endpoint
- setup/admin flow
- company identity loading
- form/report entry points
- global settings access

Output should be a file-by-file checklist of tenant-sensitive routes, models, and utilities.

### Acceptance Criteria

- [ ] File-by-file audit produced for auth/session/settings/company identity paths
- [ ] Tenant-sensitive routes/models/utilities listed
- [ ] Global settings/company identity access points identified
- [ ] Risks and recommended first implementation slice documented

---

## Issue 2 — Define invariants, migration plan, and introduce `Tenants` / `UserTenants` (#3)

### Description & Requirements

Add the core tenant and membership domain model, and formalize the split between auth identity, tenant membership, and personnel profile before implementation spreads.

Requirements:

- create `Tenants` table/model
- create `UserTenants` table/model
- define associations between users, tenants, memberships, and members
- define schema constraints and indexes
- support default membership selection
- support membership status
- define how current `User` permission flags map into membership-scoped permissions/roles
- define `Member` as tenant-owned profile/personnel data rather than auth state
- define the legacy single-tenant data migration approach

### Acceptance Criteria

- [ ] `Tenants` table/model created
- [ ] `UserTenants` table/model created
- [ ] Associations compile and app boots
- [ ] Default membership semantics are represented in schema/model design
- [ ] Permission/role migration path from `User` to `UserTenants` is documented
- [ ] `Member` responsibility is documented as tenant-owned profile/personnel data
- [ ] Unique `(userId, tenantId)` membership constraint is defined
- [ ] One-default-membership-per-user rule is defined
- [ ] Legacy single-tenant data migration path is documented

---

## Issue 3 — First-user bootstrap creates owned default tenant (#4)

### Description & Requirements

Update registration/bootstrap behavior so the first time a self-registered user is created, the system also creates that user's owned default tenant and default membership.

Requirements:

- create tenant automatically during first-user bootstrap flow
- create membership linking user to tenant
- mark membership as default
- assign owner permissions for that tenant
- implement bootstrap as one database transaction
- make bootstrap idempotent under retry
- define tenant naming/slug generation behavior

### Acceptance Criteria

- [ ] User creation bootstrap creates tenant
- [ ] Membership is created automatically
- [ ] Membership is marked as default
- [ ] Owner role is assigned automatically
- [ ] Bootstrap is transactional
- [ ] Retry does not create duplicate tenant or membership records
- [ ] User can enter the created tenant immediately after auth

---

## Issue 4 — Implement membership-based login/session flow (#5)

### Description & Requirements

Update authentication so user identity is global and tenant access comes from memberships.

Requirements:

- authenticate the user as a global human identity
- resolve memberships after successful auth
- select default tenant automatically where appropriate
- persist only current tenant identifier in session
- derive membership validity from the database on protected requests
- define behavior when the user has zero, one, or many active memberships
- add service/API support for explicit tenant switching

### Acceptance Criteria

- [ ] Login authenticates user identity first
- [ ] Memberships are resolved after auth
- [ ] Session stores only current tenant context
- [ ] Protected requests re-validate current membership from the database
- [ ] Default tenant behavior works for a multi-tenant user
- [ ] Explicit tenant switching behavior is defined for MVP

---

## Issue 5 — Add request-level tenant context middleware (#6)

### Description & Requirements

Add standard request-level tenant context so protected routes can reliably access the current tenant.

Requirements:

- expose `req.tenant` and/or `req.tenantId`
- validate current tenant belongs to authenticated user's memberships
- provide reusable helper for current tenant context

### Acceptance Criteria

- [ ] Protected requests expose current tenant context
- [ ] Tenant/session mismatch is rejected
- [ ] Shared middleware/helper is used consistently for implemented scope

---

## Issue 6 — Migrate global company/settings to tenant-owned settings (#7)

### Description & Requirements

Replace global company/system settings assumptions with tenant-scoped storage.

Requirements:

- identify global settings source(s)
- move tenant-relevant settings into DB-backed tenant-owned storage
- make issuer/company identity tenant-scoped
- update setup/admin paths accordingly

### Acceptance Criteria

- [ ] Tenant settings storage introduced
- [ ] Company identity/settings load by tenant
- [ ] Setup/admin paths no longer assume one global organization

---

## Issue 7 — Tenantize proof flow and add early integration tests (#8)

### Description & Requirements

Implement one thin end-to-end tenant-safe flow to validate the foundation, and add tests before broad tenantization.

Suggested proof flow:

- login
- current user endpoint
- company/settings load
- invoice/company header identity if practical

### Acceptance Criteria

- [ ] Proof flow works for Tenant A
- [ ] Same proof flow works for Tenant B
- [ ] Each tenant sees only its own user/company/settings context
- [ ] Integration tests cover the proof flow before wider module tenantization begins

---

## Issue 8 — Tenantize one accounting slice at a time (#9)

### Description & Requirements

Add tenant ownership to foundational accounting entities incrementally instead of as one large change.

Suggested slices:

- fiscal years / terms
- accounts / sub-accounts
- cross slips
- remaining/summary tables related to accounting

### Acceptance Criteria

- [ ] Selected accounting slice has `tenantId`
- [ ] Existing rows for that slice are backfilled safely
- [ ] CRUD/report queries are tenant-scoped for that slice
- [ ] Tests exist for the implemented slice before moving to the next one

---

## Issue 9 — Tenantize business modules one slice at a time (#10)

### Description & Requirements

Extend tenant ownership into main business modules incrementally.

Suggested slices:

- companies
- tasks
- transaction documents
- items
- projects
- vouchers
- documents
- menu/dashboard state where applicable

### Acceptance Criteria

- [ ] Selected business slice has `tenantId`
- [ ] CRUD endpoints enforce tenant scope for that slice
- [ ] Implemented slice does not expose cross-tenant data
- [ ] Tests exist for the implemented slice before moving to the next one

---

## Issue 10 — Add tenant isolation integration tests and guardrails (#11)

### Description & Requirements

Add integration tests and implementation guardrails that prove the implemented multi-tenant foundation is safe.

Focus:

- global user auth
- membership resolution
- default tenant selection
- stale/invalid session tenant fallback behavior
- tenant-specific current user/settings responses
- no cross-tenant reads/writes in implemented modules
- correct tenant company identity in forms/reports where covered
- rule that protected routes must not trust session role/permission state without DB revalidation

### Acceptance Criteria

- [ ] Login tests cover membership-based tenant entry
- [ ] API tests prove tenant isolation for implemented scope
- [ ] Session fallback behavior is tested
- [ ] Form/report tests verify correct tenant company identity where applicable
- [ ] Guardrails are documented for tenant-scoped reads/writes

---

## Recommended Execution Order

1. Audit auth/session/settings/company identity assumptions
2. Define invariants, migration plan, and introduce `Tenants` / `UserTenants`
3. First-user bootstrap creates owned default tenant
4. Membership-based login/session flow
5. Request-level tenant context middleware
6. Tenant-owned company/settings
7. Tenantized proof flow and early integration tests
8. Tenantize one accounting slice at a time
9. Tenantize business modules one slice at a time
10. Tenant isolation integration tests and guardrails

---

## First Meaningful Milestone

The first real milestone for this epic is:

**A human user can log in, enter the correct default tenant, and the app returns only that tenant’s user/company/settings context.**

The second milestone is:

**A human user with memberships in two tenants can switch tenant context safely, and each tenant remains fully isolated in the implemented proof flow.**

---

## Notes

This epic replaces the earlier simplified idea of `Users.tenantId`.

The current agreed direction is:

- `User` is global
- tenant access is membership-based
- default tenant is created for the first registered user
- session carries the currently active tenant
