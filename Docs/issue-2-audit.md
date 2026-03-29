# Issue #2 Audit — Auth, Session, Settings, Company Identity, User/Member Split

## Scope

This audit identifies current single-tenant assumptions in:

- authentication flow
- session flow
- current user endpoint
- setup/admin flow
- company identity loading
- form/report entry points
- global settings access
- current use of `models/user.js` and `models/member.js`

---

## Executive Summary

The current application is strongly single-tenant.

The biggest assumptions are:

1. **authentication is global and username-only**
2. **session stores a full user object with tenant-like permission state on the user itself**
3. **permissions are stored on `User`, not on a tenant membership**
4. **company/system settings are global file-backed state via `config/company.json`**
5. **forms/reports resolve one global “my company” identity**
6. **setup flow assumes exactly one global fiscal/accounting environment**
7. **`Member` is currently linked 1:1-ish to `User` but is not modeled as tenant-owned yet**

This means the first implementation slice should not start with broad table tenantization. It should start with:

1. define `Tenants` + `UserTenants`
2. define `User` vs `Member` responsibilities
3. redesign auth/session/current-tenant resolution
4. move settings/company identity off global config

---

## File-by-File Findings

## 1. `libs/user.js`

### What it does now

- configures `passport-local`
- authenticates using `user_name` + `password`
- `auth_user()` does `models.User.findOne({ where: { name } })`
- serializes/deserializes the entire user payload directly into session
- `is_authenticated` only checks `req.isAuthenticated()` and redirects to `/login`

### Single-tenant assumptions

- username lookup is **global**, with no tenant or membership resolution
- tenant access is not part of authentication at all
- session contains authenticated identity only, not validated current-tenant context
- protected requests do not re-check whether user still has access to a current tenant

### Multi-tenant impact

This file will need a major redesign:

- authenticate global `User`
- resolve active `UserTenant` memberships
- choose/validate current tenant
- stop treating the `User` row as the source of tenant permissions

---

## 2. `models/user.js`

### What it does now

`User` currently contains:

- `name`
- `hashPassword`
- `deauthorizedAt`
- tenant-like permission booleans:
  - `accounting`
  - `fiscalBrowsing`
  - `approvable`
  - `administrable`
  - `companyManagement`
  - `inventoryManagement`
  - `personnelManagement`

And it has:

- `hasOne(models.Member, { as: 'member' })`

### Single-tenant assumptions

- permission booleans live directly on `User`
- those booleans are treated as global truth for the whole application
- one `User` is implicitly one app-scoped operator, not one human with multiple tenant memberships

### Required direction

- keep `User` as global human identity/auth record
- move tenant-scoped permissions/role to `UserTenants`
- keep `deauthorizedAt` only if it represents global account disablement
- reconsider whether any current booleans should survive globally at all

---

## 3. `models/member.js`

### What it does now

`Member` stores personnel/profile data:

- legal/trading name
- address/contact
- bank info
- birth/employment/resignation details
- `userId`
- `memberClassId`

It links back to `User` via `userId`.

### Current meaning

`Member` is not auth state. It is already closer to:

- personnel record
- tenant-local business/person record

### Single-tenant assumptions

- no `tenantId`
- current linkage implies a user/member relation without tenant boundary
- current association design assumes one global personnel space

### Required direction

- treat `Member` as tenant-owned personnel/profile data
- likely add `tenantId`
- allow `Member.userId` to be nullable for non-login personnel
- define MVP cardinality as at most one `Member` per `(tenantId, userId)`
- do not move auth/session/default-tenant behavior into `Member`

---

## 4. `routes/api_user.js`

### What it does now

Provides user/member-related endpoints:

- `members`
- `list`
- `get`
- `update`
- `delete`
- `password`
- `signup`
- `login`

### Single-tenant assumptions

#### `members`
- returns all members with `userId != null`
- no tenant filtering
- joins `Member -> User` globally

#### `list`
- returns all users globally
- `nomember` logic depends on global `User.hasOne(Member)`
- no tenant scoping at all

#### `get`
- returns `req.session.user` as the current user payload
- current session payload is treated as authoritative

#### `update`
- allows updating permission booleans directly on `User`
- authorization depends on `req.session.user.administrable`
- this is tenant-scoped behavior incorrectly stored as global user state

#### `delete`
- deletes global users
- special-cases `id != 1`, implying one global root-style account assumption

#### `password`
- password changes operate on `req.session.user.name`
- still global, no tenant context needed here if `User` remains global

#### `signup`
- checks global username uniqueness
- `User.count() === 0` gives first-ever global user all powers
- bootstrap assumes one installation, one permission universe
- no tenant creation/membership creation

#### `login`
- on success sets `req.session.user = user.user`
- stores full user row including permission booleans in session
- no current tenant in session
- no membership resolution at all

### Required direction

This route file is one of the main implementation hotspots.

It must be split conceptually into:

- global auth/user identity operations
- membership resolution/current tenant operations
- tenant-scoped user-management operations
- optional tenant-scoped member/personnel operations

---

## 5. `app.js`

### What it does now

- initializes express session using `session-file-store`
- mounts auth-protected screens and APIs
- loads company info in `screen()` via `getCompanyInfo()`
- uses `module-list.js` authority callbacks against `req.session.user`
- serves voucher files directly if `req.session.user.accounting`

### Single-tenant assumptions

#### Session
- session store is file-based
- session stores user object under `req.session.user`
- no `currentTenantId`
- no membership revalidation per request

#### Screen routing
- `screen()` gets one global company config from `getCompanyInfo()`
- authority checks rely on permission flags on session user
- no tenant-aware module resolution

#### Voucher file access
- authorization is based on global `req.session.user.accounting`
- file lookup is by voucher file id only
- no tenant boundary check on file access

#### SPA fallback
- fallback renders shared shell without tenant validation beyond `is_authenticated`

### Required direction

- add tenant resolution / membership validation middleware
- stop trusting session-stored permissions directly
- fetch tenant-owned settings/company state instead of global config
- tenant-scope file/document access before returning binaries

---

## 6. `routes/home.js`

### What it does now

- `/home` chooses a term using `req.session.term`
- `/setup` is available only when `FiscalYear.count() === 0`
- `/closing/:term` checks `req.session.user.accounting || req.session.user.fiscalBrowsing`
- login/logout endpoints are global

### Single-tenant assumptions

- `FiscalYear.count() === 0` means one global setup state for the whole app
- `req.session.term` is one global current term, not tenant-scoped
- closing permissions come from global user booleans
- `/setup` assumes exactly one organization-wide initialization path

### Required direction

- term selection should become tenant-scoped
- setup should be tenant-aware, not installation-global
- fiscal year existence checks should be per tenant
- closing should validate current tenant membership/role

---

## 7. `libs/utils.js`

### What it does now

- `getCompanyInfo()` reads `./config/company.json` on the server
- browser side loads `/api/company/info`
- `putCompanyInfo()` writes the same global JSON file
- several formatting helpers rely on module-level `company`
- `round()` depends on `company.roundingMethod`

### Single-tenant assumptions

- `config/company.json` is one global settings file
- server-side state is process-global, not tenant-owned
- `company` is cached at module scope
- rounding and related behavior are global, not tenant-scoped

### Required direction

This is the clearest settings problem in the app.

Must be replaced by tenant-owned DB-backed configuration.

Key migration targets:

- company profile / issuer information
- rounding method
- project accounting flags
- any org-level business settings currently inferred from company info

---

## 8. `libs/my-company.js`

### What it does now

Resolves the app’s own company identity by selecting:

- browser: first company from `/api/company?kind=1`
- server: `Company.findOne({ where: { companyClassId: 1 } })`

### Single-tenant assumptions

- there is one global “my company” record
- `companyClassId: 1` is used as globally unique app issuer identity
- no tenant scope is applied to the company lookup

### Required direction

- company identity must become tenant-scoped
- `companyClassId: 1` may still mean “self company” within a tenant, but not globally
- all usages must pass current tenant context

---

## 9. `routes/forms.js`

### What it does now

- renders accounting reports and transaction PDFs
- permission checks use `req.session.user.accounting` / `fiscalBrowsing`
- all printable forms call `myCompany()` for company identity
- transaction forms load records by primary key without tenant filter in this file
- handle user/member display for documents is loaded via `TransactionDocument -> User -> Member`

### Single-tenant assumptions

- form authorization depends on global session user booleans
- company identity is global
- report initialization paths are invoked by term only, not tenant + term
- transaction/document lookups in this route do not show tenant filtering
- printed handler person info uses global `User` to `Member` association without tenant-owned membership semantics

### Required direction

- every report/document path must be tenant-scoped
- company identity must come from current tenant
- form/report init helpers must accept tenant context
- transaction handler display should be based on tenant-local member/profile data where appropriate

---

## 10. `config/module-list.js`

### What it does now

Defines navigation metadata and authority checks.

Examples:

- `user.accounting`
- `user.fiscalBrowsing`
- `user.companyManagement`
- `user.administrable`
- `user.personnelManagement`
- `company.useProjectAccounting`

### Single-tenant assumptions

- authorization relies on permission booleans directly on `user`
- `company` is treated as one current org config object with no explicit tenant boundary
- module visibility assumes session user is already correct and authoritative

### Required direction

- authority checks should eventually evaluate current membership permissions/role
- tenant settings should be passed explicitly
- module visibility must no longer depend on global user booleans

---

## Tenant-Sensitive Routes / Models / Utilities Checklist

## Auth / Session

- `libs/user.js`
- `routes/api_user.js`
- `routes/home.js`
- `app.js`
- `models/user.js`

## User / Personnel model split

- `models/user.js`
- `models/member.js`
- `routes/api_user.js`
- all places that include `User -> Member`

## Global settings / company identity

- `libs/utils.js`
- `libs/my-company.js`
- `app.js`
- `routes/forms.js`
- any `/api/company/info` implementation

## Forms / reports / document identity

- `routes/forms.js`
- report initializer libs used there
- transaction document printing paths

## Setup / installation-global assumptions

- `routes/home.js`
- any setup API logic tied to fiscal year existence

---

## Current Responsibilities of User vs Member

## Current `User`

Current responsibilities mixed together:

- authentication identity
- account disable state
- application-wide authorization flags
- link to one `Member`

This is too much for multi-tenancy.

## Current `Member`

Current responsibilities:

- personnel profile
- human/business display information
- employment/bank/contact details
- optional linkage to a login user

This is already much closer to a tenant-local personnel model.

## Recommended future split

### `User`
- global human identity
- authentication credentials
- global account-level state only
- preferences like language later

### `UserTenants`
- tenant access
- tenant role
- tenant-scoped permission flags
- default tenant marker
- active/suspended membership status

### `Member`
- tenant-local personnel/profile record
- optional link to global `User`
- not used for auth/session/tenant access

---

## Risks

1. **Cross-tenant data leak risk is high**
   - current reads are generally global
   - file/document access is not tenant-scoped

2. **Permission drift risk is high**
   - existing booleans live on `User`
   - many routes and module guards rely on them directly

3. **Bootstrap ambiguity exists**
   - current signup only creates a user
   - first-user logic is global, not tenant-based

4. **Global settings coupling is high**
   - `config/company.json` is one shared file
   - process-global `company` state is unsafe for multi-tenant behavior

5. **Setup flow is globally anchored**
   - fiscal year count drives setup availability globally
   - term selection is stored globally in session

6. **Member/User coupling may confuse migration**
   - current `User.hasOne(Member)` will not map directly to multi-tenant membership

---

## Recommended First Implementation Slice

Do not start by tenantizing all business tables.

Start with this sequence:

1. define invariants for `User`, `UserTenants`, and `Member`
2. add `Tenants` and `UserTenants`
3. redesign signup/bootstrap to create default tenant + owner membership
4. redesign login/session/current-tenant resolution
5. move global company/settings access off file-backed global state
6. prove one narrow flow:
   - login
   - current user
   - company/settings

Only after that should broader table tenantization begin.

---

## Recommended Verify Process for Issue #2

- Read and confirm the audited files listed above
- Review whether any omitted auth/settings/company code paths remain
- Use this audit as the basis for Issue #3 schema/invariant design
