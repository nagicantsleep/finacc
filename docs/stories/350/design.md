# Technical Design: Story 350 (Expense Reimbursement & Advances)

## 1. Data Architecture & Models

All models reside in `models/` with strict multi-tenant isolation (`tenantId: { allowNull: false }`, `belongsTo(Tenant)`).

### A. `ExpenseCategory` (`models/expensecategory.js` -> `ExpenseCategories`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `name`: String(100), NOT NULL
- `code`: String(50), NOT NULL
- `accountCode`: String(20), default '642' (Default debit accounting account)
- `icon`: String(50), default 'bi-receipt'
- `description`: Text, NULL
- `requiresReceipt`: Boolean, default true
- `status`: String(20), default 'active'
- Unique index: `['tenantId', 'code']`

### B. `ExpenseAdvance` (`models/expenseadvance.js` -> `ExpenseAdvances`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `userId`: Integer, NOT NULL (FK -> `Users.id`)
- `tenantMemberId`: Integer, NULL (FK -> `TenantMembers.id`)
- `projectId`: Integer, NULL (FK -> `Projects.id`)
- `code`: String(50), NOT NULL
- `title`: String(255), NOT NULL
- `amount`: Decimal(12, 2), NOT NULL
- `requestDate`: DATEONLY, NOT NULL
- `expectedDate`: DATEONLY, NULL
- `purpose`: Text, NULL
- `status`: ENUM('pending', 'approved', 'disbursed', 'settled', 'rejected'), default 'pending'
- `reviewedById`: Integer, NULL (FK -> `Users.id`)
- `reviewedAt`: DATE, NULL
- `reviewComment`: Text, NULL
- `crossSlipId`: Integer, NULL (FK -> `CrossSlips.id`)

### C. `ExpenseClaim` (`models/expenseclaim.js` -> `ExpenseClaims`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `userId`: Integer, NOT NULL (FK -> `Users.id`)
- `tenantMemberId`: Integer, NULL (FK -> `TenantMembers.id`)
- `projectId`: Integer, NULL (FK -> `Projects.id`)
- `expenseAdvanceId`: Integer, NULL (FK -> `ExpenseAdvances.id`)
- `code`: String(50), NOT NULL
- `title`: String(255), NOT NULL
- `claimDate`: DATEONLY, NOT NULL
- `totalAmount`: Decimal(14, 2), default 0.00
- `advanceAmount`: Decimal(14, 2), default 0.00
- `netAmount`: Decimal(14, 2), default 0.00 (Total - Advance)
- `status`: ENUM('draft', 'submitted', 'approved', 'settled', 'rejected'), default 'draft'
- `reviewedById`: Integer, NULL (FK -> `Users.id`)
- `reviewedAt`: DATE, NULL
- `reviewComment`: Text, NULL
- `crossSlipId`: Integer, NULL (FK -> `CrossSlips.id`)
- `note`: Text, NULL

### D. `ExpenseClaimItem` (`models/expenseclaimitem.js` -> `ExpenseClaimItems`)
- `id`: Primary key (Integer, AUTO_INCREMENT)
- `tenantId`: Integer, NOT NULL (FK -> `Tenants.id`)
- `expenseClaimId`: Integer, NOT NULL (FK -> `ExpenseClaims.id`)
- `expenseCategoryId`: Integer, NOT NULL (FK -> `ExpenseCategories.id`)
- `companyId`: Integer, NULL (FK -> `Companies.id` - Merchant/Partner)
- `voucherId`: Integer, NULL (FK -> `Vouchers.id` - Electronic receipt)
- `date`: DATEONLY, NOT NULL
- `amount`: Decimal(12, 2), NOT NULL
- `taxAmount`: Decimal(12, 2), default 0.00
- `taxRuleId`: Integer, NULL (FK -> `TaxRules.id`)
- `description`: Text, NOT NULL
- `receiptUrl`: String(500), NULL

---

## 2. API Endpoints (`/api/expense/*`)

- `GET /api/expense/categories`: List expense categories.
- `POST /api/expense/categories`: Create/update expense category.
- `GET /api/expense/advances`: List advance requests.
- `POST /api/expense/advances`: Submit an advance request.
- `PUT /api/expense/advances/:id/review`: Approve / disburse / reject advance.
- `GET /api/expense/claims`: List expense claims.
- `POST /api/expense/claims`: Create new expense claim with multi-line items.
- `GET /api/expense/claim/:id`: Get single claim detail with itemized lines, linked advance, and accounting slip.
- `PUT /api/expense/claim/:id`: Update claim and items.
- `PUT /api/expense/claim/:id/review`: Approve / reject claim.
- `POST /api/expense/claim/:id/create-voucher`: **Accounting Integration**: Create `CrossSlip` with debit lines per expense category, credit 141 (advance offset), credit 334/111 (net reimbursement).
- `GET /api/expense/claim/:id/export`: Export claim report to CSV.
