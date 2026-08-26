# Overview

## Current Behavior

- Currently, Hieronymus manages fixed entities: Accounts, Companies, Tasks, Projects, Vouchers, Transactions, Items.
- There is no generic mechanism for businesses to define custom registries (台帳) like VIP interaction journals, warranty logs, custom contract registries, or asset records.

## Target Behavior

- Implement a full **Custom Registry & Dynamic Ledger System (台帳管理システム)**:
  - Users can create and configure custom registry definitions with flexible JSON schemas (fields: text, number, date, select, checkbox, textarea, companyRef, userRef).
  - Dynamic records (RegistryEntries) are stored with tenant isolation and validated against their active definition.
  - Full CRM interaction timeline (RegistryTimeline) to record interactions, activity notes, status changes, and diffs.
  - Interactive Svelte UI: Registry list, visual form builder / schema designer, data grid with search & filter, modal detail with timeline.
  - CSV/Excel export for reporting.

## Affected Users

- Business owners, managers, accountants, sales, and personnel administrators.

## Affected Product Docs

- `docs/ARCHITECTURE.md`
- `README.md`
