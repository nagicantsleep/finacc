# Exec Plan

## Goal

Build and integrate the Custom Registry & Dynamic Ledger System (台帳管理システム) into Hieronymus with complete tenant isolation, backend validation APIs, and Svelte UI.

## Scope

In scope:
- Database migration: `RegistryDefinitions`, `RegistryEntries`, `RegistryTimelines`.
- Sequelize models with `belongsTo(Tenant)`.
- Backend router `/api/registry` with full CRUD, timeline comments, and export.
- Frontend Svelte views under `front/svelte/registry/`:
  - `RegistryList.svelte`
  - `RegistryDesigner.svelte`
  - `RegistryDataGrid.svelte`
  - `RegistryDetail.svelte`
- Sidebar integration in `config/module-list.js` with bilingual tokens.
- Unit, integration, and browser E2E test suites.

Out of scope:
- External CRM third-party sync APIs.

## Risk Classification

Risk flags:
- High-risk feature introducing dynamic JSONB schema execution and multi-tenant custom data storage.

Hard gates:
- All new models must have `belongsTo(Tenant)` and pass `tenant-association-guard`.
- JSON schema validation must strictly enforce required/typed field rules.
- 100% of tests must pass.
