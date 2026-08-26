# Execution Plan: Story 348 (Attendance & Payroll System)

## Phase 1: Database Layer & Migration
- [x] Create 5 models in `models/`:
  - `models/attendancerecord.js`
  - `models/leaverequest.js`
  - `models/salaryformula.js`
  - `models/payrollperiod.js`
  - `models/payrollslip.js`
- [x] Register models and associations in `models/index.js`.
- [x] Create migration `migrations/20260828000000-create-attendance-payroll.cjs`.
- [x] Run migration and verify `test/tenant-association-guard.test.mjs` (all models compliant).

## Phase 2: Backend Business Logic & API
- [x] Create router `routes/api_attendance.js` (clock in/out, monthly sheet, leave workflow).
- [x] Create router `routes/api_payroll.js` (formula setup, period calculation, voucher generation).
- [x] Mount subrouters in `routes/api.js`.
- [x] Write comprehensive integration tests `test/attendance-payroll.test.mjs`.

## Phase 3: Frontend Svelte UI & Bilingual I18n
- [x] Add bilingual translation keys in `ja.json`, `vi.json`, `en.json`.
- [x] Create Svelte components under `front/svelte/attendance/`:
  - `front/svelte/attendance/attendance.svelte`
  - `front/svelte/attendance/ClockPanel.svelte`
  - `front/svelte/attendance/MonthlyTimesheet.svelte`
  - `front/svelte/attendance/LeaveRequestModal.svelte`
- [x] Create Svelte components under `front/svelte/payroll/`:
  - `front/svelte/payroll/payroll.svelte`
  - `front/svelte/payroll/PayrollPeriodList.svelte`
  - `front/svelte/payroll/PayrollCalculationView.svelte`
  - `front/svelte/payroll/PayslipModal.svelte`
  - `front/svelte/payroll/SalaryFormulaModal.svelte`
- [x] Register modules in `config/module-list.js` and `front/svelte/index.svelte`.
- [x] Run `npm run build` with 0 errors.

## Phase 4: Verification & Completion
- [x] Run automated test suite (`npm run test:all`).
- [x] Execute Browser E2E verification via `browser_subagent`.
- [x] Record Harness story proof & trace.
- [x] Open Pull Request to `main`.
