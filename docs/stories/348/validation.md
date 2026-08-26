# Validation Plan: Story 348

## 1. Automated Integration Tests (`test/attendance-payroll.test.mjs`)
1. **Attendance Flow:**
   - Clock-in -> Clock-out -> Verify workHours, overtimeHours, status.
   - Prevent duplicate clock-in on same day.
   - Monthly timesheet calculation.
2. **Leave Workflow:**
   - Submit leave request -> Status `pending`.
   - Manager approve leave request -> Status `approved`.
3. **Salary Formula & Calculation:**
   - Define base salary (3,000,000) + commute allowance (200,000) + health insurance (5%).
   - Create payroll period -> Run batch calculation.
   - Verify gross pay, overtime pay, deductions, and net pay.
4. **Accounting Voucher Generation:**
   - Call `/api/payroll/periods/:id/create-voucher`.
   - Verify `CrossSlip` is created with balanced debit and credit entries (`CrossSlipDetail`).
   - Verify `PayrollPeriod.crossSlipId` is updated.
5. **Multi-Tenant Isolation:**
   - Ensure Tenant B cannot access Tenant A attendance or payroll periods.

## 2. Tenant Association Guard
- Run `npx mocha test/tenant-association-guard.test.mjs` to ensure 100% compliance across all 45 models.

## 3. Browser E2E Verification
- Clock-in and Clock-out from UI.
- Submit a leave request.
- Run monthly payroll calculation -> View itemized payslip modal.
- Click "Tạo Bút toán Kế toán" -> Verify journal voucher created and viewable.
