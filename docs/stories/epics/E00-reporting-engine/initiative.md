# E00 — Reporting Engine Foundation

> Initiative notes. Shared artifact (committed). Mapped to git branch `epic/reporting-engine` and GitHub label `epic:reporting-engine`.

Date: 2026-06-07
Status: proposed
Lane: high-risk (touches calculation core, multi-tenant closing, data integrity)

## Goal

Tạo một calculation engine duy nhất cho mọi báo cáo tài chính (試算表, simulated TB, comparison, ledger), đồng thời sửa quy trình đóng sổ đang hỏng sau khi lên multi-tenant. E0 là nền bắt buộc cho E1, E2, E3 — nếu không có E0, các epic sau sẽ đẻ logic riêng và actual ≠ simulated.

## Why now

- `libs/trial_balance.js`, `front/svelte/trial-balance/trial-balance.svelte:151`, `libs/ledger.js` đang tính balance theo 3 cách khác nhau. Frontend tính lại balance là rủi ro cao nhất.
- `forms/closing.js:42` gọi `Accounts.all3(fy.term)` trong khi signature yêu cầu `(tenantId, term, languagePair)` → truyền nhầm tham số.
- `routes/api.js:92` và `routes/home.js:11` gọi `closing(term)` thiếu `tenantId` → sẽ throw hoặc ghi sai tenant.
- Không có engine chuẩn → E2 simulation sẽ tự viết calculator riêng, sinh bug so sánh.

## Affected product docs (to be created in E0)

- `docs/product/reporting/calculation-engine.md` — domain rules, mô hình balance, opening/movement/ending.
- `docs/product/reporting/closing-process.md` — closing flow, BS carry-forward, PL reset, 繰越利益剰余金, multi-tenant guards.
- `docs/product/reporting/warnings.md` — mã cảnh báo TB-W001..W010 (canonical list lấy từ BRD mục 10.9).

## Scope

**In scope:**
- Một engine tính số dư/movement duy nhất, dùng được cho actual, simulated, ledger.
- Closing đa tenant đúng, có confirm UI.
- Xoá logic tính balance ở frontend (màn legacy `/trial-balance`).
- Unit test cho engine: BS carry-forward, PL reset, debit=credit, hierarchy subtotal.

**Out of scope:**
- 3 report type 試算表 (E1).
- Simulation (E2).
- Forecast (E3).
- Sửa UI màn `/trial-balance` cũ sang 3 tab (E1).

## Architecture direction

### Reporting engine (canonical)

```text
libs/reporting/balance-engine.js

  balanceEngine({
    tenantId,                // required
    term,                    // required, FiscalYear.term
    period: { from, to },    // inclusive day boundary
    entrySources: [          // one or more async iterators of "movement lines"
      { name: 'actual',    fetch: () => CrossSlipDetail[] },
      { name: 'simulation', fetch: () => SimulationEntry[] }  // future
    ],
    options: {
      includeUnapproved = false,
      accountClassIds = null,
      projectIds = null,
      labelIds = null,
      subAccount = true
    }
  }) → {
    lines: [{
      accountId, subAccountId|null,
      code, name, nameVi, subCode, subName, subNameVi,
      major, middle, minor, majorVi, middleVi, minorVi,
      openingDebit, openingCredit, openingBalance,
      movementDebit, movementCredit,
      endingDebit, endingCredit, endingBalance
    }],
    warnings: [{ code, severity, message, ref }],
    meta: { generatedAt, entrySourceNames, tenantId, term, period }
  }
```

Key rules:
- Opening lấy từ `AccountRemaining`/`SubAccountRemaining` (giữ pattern hiện tại). `field(code) >= 6` (revenue/expense) chỉ có movement ở kỳ hiện tại; opening từ term trước = 0.
- Movement cộng dồn từ tất cả `entrySources`. Mỗi entry = 1 dòng Nợ/Có theo `account_code` + `sub_account_code`.
- Ending tính theo `dc(code)` nature:
  - D: `ending = opening + debit - credit`
  - C: `ending = opening - debit + credit`
- Subtotal theo `AccountClass` được tính trong consumer (UI/export), engine trả flat list.
- Decimal an toàn: dùng `numeric()` helper đã có, tránh float. Mọi tổng phải có thể chạy `debitTotal === creditTotal` cho mọi period (sanity invariant).

### Multi-tenant guards

- Mọi query trong engine scope theo `tenantId`. Bắt buộc tham số, không default.
- `AccountRemaining`/`SubAccountRemaining` đã có `tenantId` — chỉ cần truyền đúng.
- Closing phải từ chối nếu thiếu `tenantId` (throw ở top-level guard, không để truyền nhầm vào `AccountId` chỗ `tenantId`).

### Closing flow (fixed)

```text
POST /api/closing/:term          (existing endpoint, just fix params)
  └─> requireTenant middleware
        └─> closing(tenantId, term)
              ├─> fiscalYear(tenantId, term)  // returns [fy, nfy]
              ├─> balanceEngine(tenantId, fy.term, { from, to: fy.endDate }, { entrySources: [actual] })
              ├─> net_income = Σ revenue accounts (field >= 6 && <= 9) credit - debit
              ├─> 繰越利益剰余金 (5040000): ending = previous + net_income
              └─> Closing: for each account/subaccount
                    if field(code) < 6 (BS):  // 1,2,3,4,5
                      AccountRemaining(nfy.term).{debit,credit,balance} = endingBalance
                    else if field(code) >= 6 (PL):
                      reset to 0 in nfy.term
```

Pl hard-coded special case `7020010` (期末商品棚卸高) — dc='C' override — must be preserved.

### Closing confirm UI

- Route mới: `GET /closing/:term/confirm` (Svelte form, server-rendered).
- Trang hiển thị: term + tenant + cảnh báo "操作は取り消せません" (hành động không thể huỷ) + checklist:
  - [ ] Tất cả CrossSlip trong term đã approved (đếm số unapproved).
  - [ ] Tổng Debit = Tổng Credit của term (tính từ engine).
  - [ ] `FiscalYear` kỳ kế tiếp chưa tồn tại hoặc đang trống.
  - [ ] **PL precheck** (mục 0.3 đã chốt): nếu bất kỳ `AccountRemaining(nextTerm, plAccount)` đã có debit/credit ≠ 0, hiển thị **banner đỏ** "Kỳ kế tiếp đã có số dư PL — sẽ bị reset khi đóng sổ". Checkbox bắt buộc "Tôi đã hiểu và muốn tiếp tục" phải tick trước khi nút "Đóng sổ" enable. (Quyết định reset: admin role; role khác → 403.)
- Nút "Đóng sổ" → POST `/api/closing/:term` (kèm cờ `plResetAcknowledged=true` để server không reject).
- Sau khi đóng sổ xong: chuyển `/reports/trial-balance?term=<nfy>` với banner "Đã đóng sổ term X".
- Audit: ghi bảng **`AuditEvent`** (bảng mới — mục 0.4 đã chốt) với `action='closing', term, tenantId, actorId, payload={plResetAcknowledged, totalsSnapshot, warnings}`.

## Risk classification

Risk flags (theo `docs/FEATURE_INTAKE.md`):
- **Data model** — sửa schema tham chiếu, không migration mới.
- **Public contracts** — `api_trial_balance.js`, `api_ledger.js`, `api/closing/:term` response shape.
- **Existing behavior** — đụng calculation core, frontend.
- **Multi-domain** — closing, trial balance, ledger.
- **Audit/security** — closing = destructive, cần audit log.
- **Auth** — phải gắn `is_authenticated` + `requireTenant`.

Hard gates: Data loss risk, Authorization, Audit/security.
→ **Lane: high-risk**. Mỗi issue phải dùng `docs/templates/high-risk-story/` folder (execplan/overview/design/validation).

## Candidate stories (issues)

| # | Title | Lane | Depends on | Notes |
|---|---|---|---|---|
| 0.1 | `libs/reporting/balance-engine.js` core + unit tests | high-risk | — | Foundation. Engine đơn nguồn, không phụ thuộc Express/Svelte. |
| 0.2 | Wire engine vào `routes/api_trial_balance.js`, xoá frontend re-compute | high-risk | 0.1 | Màn legacy vẫn dùng được, balance chỉ từ server. |
| 0.3 | Sửa `forms/closing.js` cho đa tenant | high-risk | 0.1 | Sửa call sites, dùng engine, verify carry-forward. |
| 0.4 | Closing confirm UI + audit log | high-risk | 0.3 | Svelte form, checklist, button "Đóng sổ". |
| 0.5 | Reconciliation test: engine ending == ledger sums | high-risk | 0.1, 0.2 | Mocha, chạy 2 cách rồi assert bằng nhau cho 10 accounts + 5 sub-accounts cố định. |

Không tạo `SimulationEntry` hay model mới ở E0. Engine chỉ chấp nhận `entrySources` là contract.

## Validation ladder

- **Unit:** mocha test `test/reporting/balance-engine.test.js`. Cases:
  - Account D-nature: ending = opening + debit - credit.
  - Account C-nature: ending = opening - debit + credit.
  - `7020010` override: dù dc=702 → dc=C, balance theo C-nature.
  - Revenue/expense: opening=0 kể cả khi kỳ trước có số dư (sau closing).
  - `entrySources` nhiều nguồn: totalDebit = totalCredit.
  - Subtotal: Σ endingBalance con = endingBalance parent (engine trả flat, test consumer).
  - Decimal safety: amount lớn + phép cộng nhiều lần không lệch.
- **Integration:** closing một term mẫu, đọc `AccountRemaining` kỳ sau khớp ending kỳ trước cho BS; PL kỳ sau = 0.
- **Reconciliation:** engine ending == `ledgerLines(...).sums.balance` (cho cùng account/subaccount/period).
- **E2E:** `npm start`, mở `/closing/2024/confirm`, đóng sổ, `/trial-balance` kỳ sau hiển thị số dư mới.
- **Smoke:** `npm run build` + `npm test` pass.

## Exit criteria

E0 done khi tất cả:
- [ ] `balance-engine.js` tồn tại, có unit test, có JSDoc.
- [ ] Frontend `trial-balance.svelte` không còn `numeric + dc()` re-compute; chỉ render.
- [ ] `closing.js` nhận `(tenantId, term)`, throw rõ ràng nếu thiếu.
- [ ] `/closing/:term/confirm` hoạt động với checklist + audit log.
- [ ] Reconciliation test pass.
- [ ] Test Report đăng lên GitHub issue của từng story; trace ghi vào `harness.db` key theo issue number.
- [ ] PR `epic/reporting-engine` → `main` merge sạch, không có vấn đề reopen.

## Open decisions (đã chốt 2026-06-07)

1. **0.1** `entrySources` = **array of fetchers** `[{name, fetch}]`. Engine log từng nguồn qua `meta.entrySourceNames` để audit/debug simulation về sau.
2. **0.3** Closing confirm UI: nếu `AccountRemaining(nextTerm, plAccount)` đã có debit/credit ≠ 0 thì **warning đỏ**, admin phải confirm thêm 1 lần trước khi reset.
3. **0.4** Audit log dùng **bảng mới `AuditEvent`** (không dùng `MonthlyLog`). Volume simulation/E2 sẽ cao, cần schema chuyên dụng. E2/E3 sẽ dùng chung.
4. **0.5** Reconciliation test: **fix 10 accounts + 5 sub-accounts** đại diện (BS D, BS C, PL, edge case `7020010`, có sub-account). Không random để debug dễ. Phase 2 sẽ thêm property-based test.

## Follow-up (out of E0 nhưng cần nhắc)

- Sau E0, mọi epic downstream (E1/E2/E3) bắt buộc dùng engine. CI sẽ có rule (lint hoặc test) cấm import `AccountRemaining.findAll`/`CrossSlipDetail.findAll` trực tiếp ở route/UI — phải qua engine. Có thể thêm ở E1 PR.
- Khi E2 đến, `entrySources` contract đã có sẵn, chỉ thêm `simulation` source.
- Khi E3 đến, `SimulationAssumption` là wrapper sinh `SimulationEntry` — engine không cần đổi.
