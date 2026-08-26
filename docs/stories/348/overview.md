# Story 348: Attendance & Payroll System with Direct Accounting Integration (勤怠給与システム)

## 1. Executive Summary
This story implements the complete **Attendance & Payroll System** directly integrated into the Hieronymus accounting ledger.
It enables time tracking (clock in/out, overtime, work schedules), leave management with approval workflows, automated gross-to-net salary calculation, and automatic journal generation (`CrossSlip` / 伝票起票) for payroll liabilities and expense recognition.

## 2. Core Objectives
1. **Attendance Tracking:** Real-time clock in/out, work status tagging (regular, remote, overtime, late/early), daily work hour calculation.
2. **Leave Management:** Paid annual leave, unpaid leave, sick leave with multi-status review (`pending`, `approved`, `rejected`).
3. **Salary Structure:** Configurable base pay, allowances (commute, housing, position, meal), statutory deductions (health, pension, unemployment insurance, income tax), and overtime multipliers.
4. **Payroll Run:** Monthly batch calculation of payslips per tenant member, tracking status (`draft`, `calculated`, `approved`, `paid`).
5. **Direct Accounting Integration:** Automatic journal posting (`CrossSlip` + `CrossSlipDetail`) debiting payroll expense accounts (641/642) and crediting payable/withholding accounts (334/338).
6. **Multi-Tenant & Bilingual:** 100% strict tenant scoping (`tenantId`), bilingual stacked UI (`<BilingualText>`).
