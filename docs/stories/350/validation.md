# Validation Plan: Story 350

## 1. Automated Integration Tests (`test/expense.test.mjs`)
1. **Expense Categories:**
   - Create category (e.g. Travel / 旅費交通費 with default account 642).
   - List categories.
2. **Advances Workflow:**
   - Submit travel advance request (e.g. 5,000,000 đ) -> status `pending`.
   - Manager approve & disburse advance -> status `disbursed`.
3. **Expense Claims & Advance Offset:**
   - Create expense claim linking advance (e.g. 3 lines totaling 7,200,000 đ).
   - Advance offset: 7,200,000 - 5,000,000 = 2,200,000 đ net reimbursement.
   - Manager approve claim -> status `approved`.
4. **General Ledger Accounting Voucher Integration:**
   - Call `/api/expense/claim/:id/create-voucher`.
   - Verify `CrossSlip` is created with debit lines for expenses, credit 141 (advance offset 5M), credit 334/111 (net reimbursement 2.2M).
   - Verify `advance.status` is updated to `settled`.
   - Verify export CSV.
5. **Multi-Tenant Isolation:**
   - Ensure Tenant B cannot access Tenant A expense categories, advances, or claims.

## 2. Tenant Association Guard
- Run `npx mocha test/tenant-association-guard.test.mjs` ensuring 100% compliance across all 49 models.

## 3. Browser E2E Verification
- Create an advance request.
- Create an expense claim with multiple expense items and link the advance.
- Manager approve claim.
- Click "Tạo Bút toán Kế toán" -> Verify journal voucher created and viewable.
