# Story 350: Expense Reimbursement, Advances & Project Allocation System (経費精算システム)

## 1. Executive Summary
This story implements the **Expense Reimbursement, Advances & Project Allocation System** in Hieronymus.
It covers expense category/policy management, travel/cash advances (仮払金), multi-line expense claim reports with receipt attachments, project linking, multi-level review/approval, and automated General Ledger accounting voucher generation (`CrossSlip` / 伝票起票).

## 2. Core Objectives
1. **Expense Categories & Policies:** Configure standard expense types (transportation, meals, lodging, supplies, client entertainment) with default accounting accounts and tax rules.
2. **Advances Management:** Employees request travel/project advances, managers approve, and accounting tracks disbursement (Debit 141 / Credit 111/112).
3. **Expense Claims & Items:** Multi-line expense claims supporting project/client allocation, receipt attachments, and automatic advance offset.
4. **Direct Accounting Integration:** Automatic journal posting (`CrossSlip` + `CrossSlipDetail`) debiting expense accounts, clearing advance accounts (141), and crediting reimbursement liabilities (334/111/112).
5. **Multi-Tenant & Bilingual:** 100% tenant-isolated, stacked `<BilingualText>` (JA / VI / EN).
