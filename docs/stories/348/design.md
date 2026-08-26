# Technical Design: Story 348 (Attendance & Payroll)

## 1. Data Architecture & Models

All models reside in `models/` with strict multi-tenant isolation (`tenantId: { allowNull: false }`, `belongsTo(Tenant)`).

### A. `AttendanceRecord` (`models/attendancerecord.js` -> `AttendanceRecords`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `userId`: Integer, NOT NULL (FK -> `Users.id`)
- `tenantMemberId`: Integer, NULL (FK -> `TenantMembers.id`)
- `date`: DATEONLY, NOT NULL (YYYY-MM-DD)
- `clockIn`: DATE, NULL (Actual clock-in timestamp)
- `clockOut`: DATE, NULL (Actual clock-out timestamp)
- `breakMinutes`: Integer, default 60
- `workHours`: Decimal(5,2), default 0.00
- `overtimeHours`: Decimal(5,2), default 0.00
- `nightHours`: Decimal(5,2), default 0.00
- `lateMinutes`: Integer, default 0
- `earlyMinutes`: Integer, default 0
- `status`: String, ENUM('present', 'absent', 'late', 'leave', 'holiday', 'remote', 'overtime')
- `note`: Text, NULL
- `ipAddress`: String, NULL
- Unique index: `['tenantId', 'userId', 'date']`

### B. `LeaveRequest` (`models/leaverequest.js` -> `LeaveRequests`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `userId`: Integer, NOT NULL (FK -> `Users.id`)
- `tenantMemberId`: Integer, NULL (FK -> `TenantMembers.id`)
- `leaveType`: ENUM('paid_annual', 'unpaid', 'sick', 'maternity', 'special')
- `startDate`: DATEONLY, NOT NULL
- `endDate`: DATEONLY, NOT NULL
- `days`: Decimal(4,1), NOT NULL
- `reason`: Text, NULL
- `status`: ENUM('pending', 'approved', 'rejected', 'cancelled'), default 'pending'
- `reviewedById`: Integer, NULL (FK -> `Users.id`)
- `reviewedAt`: DATE, NULL
- `reviewComment`: Text, NULL

### C. `SalaryFormula` (`models/salaryformula.js` -> `SalaryFormulas`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `tenantMemberId`: Integer, NULL (FK -> `TenantMembers.id` - if specific to member)
- `memberClassId`: Integer, NULL (FK -> `MemberClasses.id` - if default for class)
- `baseSalary`: Decimal(12,2), default 0.00
- `hourlyRate`: Decimal(10,2), default 0.00
- `overtimeMultiplier`: Decimal(4,2), default 1.25
- `weekendMultiplier`: Decimal(4,2), default 1.50
- `holidayMultiplier`: Decimal(4,2), default 2.00
- `allowances`: JSONB, default `[]` (e.g. `[{ key: 'position', name: '役職手当', amount: 50000 }]`)
- `deductions`: JSONB, default `[]` (e.g. `[{ key: 'health_ins', name: '健康保険料', rate: 0.05 }]`)
- `status`: String, default 'active'

### D. `PayrollPeriod` (`models/payrollperiod.js` -> `PayrollPeriods`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `year`: Integer, NOT NULL
- `month`: Integer, NOT NULL
- `startDate`: DATEONLY, NOT NULL
- `endDate`: DATEONLY, NOT NULL
- `paymentDate`: DATEONLY, NULL
- `status`: ENUM('draft', 'calculated', 'approved', 'paid', 'closed'), default 'draft'
- `totalGrossPay`: Decimal(14,2), default 0.00
- `totalDeductions`: Decimal(14,2), default 0.00
- `totalNetPay`: Decimal(14,2), default 0.00
- `crossSlipId`: Integer, NULL (FK -> `CrossSlips.id` - Accounting Voucher link)
- `paymentCrossSlipId`: Integer, NULL (FK -> `CrossSlips.id` - Payment Settlement Voucher link)
- Unique index: `['tenantId', 'year', 'month']`

### E. `PayrollSlip` (`models/payrollslip.js` -> `PayrollSlips`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `payrollPeriodId`: Integer, NOT NULL (FK -> `PayrollPeriods.id`)
- `tenantMemberId`: Integer, NOT NULL (FK -> `TenantMembers.id`)
- `userId`: Integer, NULL (FK -> `Users.id`)
- `workingDays`: Integer, default 0
- `workHours`: Decimal(6,2), default 0.00
- `overtimeHours`: Decimal(6,2), default 0.00
- `leaveDays`: Decimal(4,1), default 0.00
- `basePay`: Decimal(12,2), default 0.00
- `overtimePay`: Decimal(12,2), default 0.00
- `allowancesDetail`: JSONB, default `{}`
- `allowancesTotal`: Decimal(12,2), default 0.00
- `grossPay`: Decimal(12,2), default 0.00
- `deductionsDetail`: JSONB, default `{}`
- `deductionsTotal`: Decimal(12,2), default 0.00
- `netPay`: Decimal(12,2), default 0.00
- `status`: ENUM('draft', 'calculated', 'approved', 'paid'), default 'draft'
- `note`: Text, NULL
- Unique index: `['tenantId', 'payrollPeriodId', 'tenantMemberId']`

---

## 2. API Endpoints

### Attendance (`/api/attendance/*`)
- `POST /api/attendance/clock-in`: Clock in for current user.
- `POST /api/attendance/clock-out`: Clock out for current user.
- `GET /api/attendance/today`: Today's attendance status.
- `GET /api/attendance/monthly`: Get monthly sheet by year/month for current user or all members.
- `POST /api/attendance/record`: Manager manual adjust/create attendance record.
- `GET /api/attendance/leaves`: List leave requests.
- `POST /api/attendance/leaves`: Submit a leave request.
- `PUT /api/attendance/leaves/:id/review`: Approve / reject leave request.

### Payroll (`/api/payroll/*`)
- `GET /api/payroll/formulas`: List salary formulas.
- `POST /api/payroll/formulas`: Create/update salary formula for member or class.
- `GET /api/payroll/periods`: List payroll periods.
- `POST /api/payroll/periods`: Create new payroll period.
- `POST /api/payroll/periods/:id/calculate`: Calculate all member payslips from attendance & formula.
- `GET /api/payroll/periods/:id/slips`: Get all payslips for period.
- `GET /api/payroll/slip/:id`: Get single payslip detail with itemized breakdown.
- `POST /api/payroll/periods/:id/approve`: Approve period.
- `POST /api/payroll/periods/:id/create-voucher`: Auto-generate accounting `CrossSlip` journal in General Ledger.
- `GET /api/payroll/periods/:id/export`: Export payroll summary and slips as CSV.
