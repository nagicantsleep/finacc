# Execution Plan: Story 350 (Expense Reimbursement & Advances)

## Phase 1: Database Layer & Migration
- [x] Create 4 models in `models/`:
  - `models/expensecategory.js`
  - `models/expenseadvance.js`
  - `models/expenseclaim.js`
  - `models/expenseclaimitem.js`
- [x] Register models and associations in `models/index.js`.
- [x] Create migration `migrations/20260829000000-create-expense-system.cjs`.
- [x] Run migration and verify `test/tenant-association-guard.test.mjs` (all models compliant).

## Phase 2: Backend Business Logic & API
- [x] Create router `routes/api_expense.js` (categories, advances, claims, accounting voucher generation).
- [x] Mount router in `routes/api.js`.
- [x] Write comprehensive integration tests `test/expense.test.mjs`.

## Phase 3: Frontend Svelte UI & Bilingual I18n
- [x] Add bilingual translation keys in `ja.json`, `vi.json`, `en.json`.
- [x] Create Svelte components under `front/svelte/expense/`:
  - `front/svelte/expense/expense.svelte` (Container view)
  - `front/svelte/expense/ExpenseClaimList.svelte` (Overview cards & claims table)
  - `front/svelte/expense/ExpenseClaimModal.svelte` (Multi-line expense items with advance offset)
  - `front/svelte/expense/ExpenseAdvanceModal.svelte` (Cash/travel advance requests & manager approval)
  - `front/svelte/expense/ExpenseCategoryModal.svelte` (Category setup & account mapping)
- [x] Register module in `config/module-list.js` and `front/svelte/index.svelte`.
- [x] Run `npm run build` with 0 errors.

## Phase 4: Verification & Completion
- [x] Run automated test suite (`npm run test:all`).
- [x] Execute Browser E2E verification via `browser_subagent`.
- [x] Record Harness story proof & trace.
- [x] Open Pull Request to `main`.
