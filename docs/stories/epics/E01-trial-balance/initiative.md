# E01 — Trial Balance Foundation

> Initiative notes. Shared artifact (committed). Mapped to git branch `epic/trial-balance` and GitHub label `epic:trial-balance`.

Date: 2026-06-07
Status: proposed
Lane: high-risk (touches public contract `api/trial-balance/*`, financial reporting, multi-tenant data isolation)

## Goal

Xây dựng màn hình 試算表 mới với 3 report type (残高/合計/合計残高), hierarchy đầy đủ tới 補助科目, drill-down xuống ledger và journal, cảnh báo bất thường, và export Excel. Dựa trên reporting engine đã có ở E0. Tạo màn mới `/reports/trial-balance` (3 tab); giữ màn legacy `/trial-balance` cho tới khi E1.10 mới gỡ.

## Why now

- `api_trial_balance.js` hiện chỉ trả về `lines` ở dạng balance. Chưa hỗ trợ 合計/合計残高, chưa filter phong phú, chưa drill-down, chưa export.
- `front/svelte/trial-balance/trial-balance.svelte:151` đang tính lại balance ở frontend — sẽ được gỡ ở E1.10.
- Kế toán nội bộ + 税理士 cần xem 試算表 đầy đủ + 比較 để đối chiếu.
- E2 simulation cần cùng bề mặt báo cáo với actual — phải có E1 trước mới có gì để overlay.

## Affected product docs (to be created/updated)

- `docs/product/reporting/trial-balance-reports.md` — định nghĩa 3 report type, columns, subtotals.
- `docs/product/reporting/hierarchy.md` — 大/中/小/勘定/補助 và cách engine trả subtotal.
- `docs/product/reporting/warnings.md` — TB-W001..W010 (canonical, từ BRD mục 10.9; E0 tạo file, E1 implement).
- `docs/product/reporting/bilingual-display.md` — JP/VI/bilingual mode, fallback rule, export language.
- `docs/product/reporting/export-spec.md` — Excel template cho 試算表, file name pattern.

## Scope

**In scope:**
- 3 report type: 残高試算表, 合計試算表, 合計残高試算表.
- Hierarchy 5 cấp (大/中/小/勘定/補助科目) với subtotal + expand/collapse.
- Bilingual JP/VI/bilingual mode cho account name + report header.
- Drill-down row → ledger (`api_ledger.js` đã có) → journal detail.
- Warnings TB-W001, W002, W005 (debit≠credit, unapproved tồn tại, cash/bank âm). W003/W004/W006-W010 ở E2/E3 hoặc phase sau.
- Excel export với số liệu + filter + language mode trong header.
- Filter: term, month, account class, hide-zero, language.
- Màn mới `/reports/trial-balance` 3 tab; màn legacy `/trial-balance` giữ nguyên, có banner "sẽ gỡ ở E1.10".

**Out of scope:**
- Comparison view (TB-010) — E2 nếu cần, hoặc phase 2.
- Monthly trend, project/label filter — phase 2.
- PDF export — phase 2 (đã có `forms/trial-balance` + `libs/print.js`).
- Formula engine, simulation — E2.

## Architecture direction

### New route prefix

`/reports/trial-balance` — Svelte view mới. Legacy vẫn ở `/trial-balance`. Hai URL hoạt động song song cho tới E1.10.

### API changes (additive, không phá legacy)

Mở rộng `routes/api_trial_balance.js`:

```
GET /api/trial-balance?reportType=balance|movement|combined
                          &term=<int>
                          &month=YYYY-MM[&end=true]   // optional
                          &languagePair=<json>        // existing
                          &accountClassIds=<csv>      // new
                          &hideZero=<bool>            // new
                          &includeUnapproved=<bool>   // new, default false
```

Response mới (versioned qua field `version: 2`):

```json
{
  "version": 2,
  "meta": {
    "tenantId", "term", "reportType", "period": { "from", "to" },
    "languageMode", "generatedAt", "warnings": [{ "code", "severity", "message" }],
    "totals": { "openingDebit", "openingCredit", "movementDebit", "movementCredit", "endingDebit", "endingCredit" }
  },
  "lines": [
    {
      "type": "subtotal" | "account" | "subAccount",
      "aclCode"?, "major", "middle", "minor", "majorVi", "middleVi", "minorVi",
      "accountId"?, "code"?, "name", "nameVi",
      "subAccountId"?, "subCode"?, "subName"?, "subNameVi"?,
      "openingDebit", "openingCredit", "movementDebit", "movementCredit",
      "endingDebit", "endingCredit",
      "balance": <signed by dc()>,
      "warningCodes": ["TB-W001"...]
    }
  ]
}
```

Legacy response chỉ trả `lines` (mảng phẳng) — giữ nguyên endpoint cũ để màn legacy không vỡ.

### Subtotal & hierarchy

- Engine trả flat (E0 đã chốt).
- Consumer (UI helper + export) build subtotal dọc theo `major → middle → minor` và chèn `type:'subtotal'` rows.
- Subtotal = Σ dòng con (chỉ `type:'account'`/`type:'subAccount'`).
- Subtotal cho `endingDebit`/`endingCredit`: theo dc-nature của từng account con, không gộp vào 1 cột (giữ nguyên tắc kế toán).

### Warnings

| Code | Severity | Rule | Engine action |
|---|---|---|---|
| TB-W001 | critical | Σ movementDebit ≠ Σ movementCredit cho period | Top banner, chặn export nếu strict mode |
| TB-W002 | high | Có `CrossSlip` term hiện tại có `approvedAt IS NULL` | Banner + link tới danh sách unapproved |
| TB-W005 | medium | `普通預金` (hoặc cash/bank theo config) có endingDebit < 0 | Highlight row đỏ |

Config: `lib/reporting/warning-rules.js` — array rule, mỗi rule có `id, severity, evaluate(lines, meta) → messages[]`. Phase 1 hard-code 3 rule; phase sau expose config.

### Drill-down

- Component Svelte: `<TrialBalanceDrillDown>` mở **modal** (mục 1.5 đã chốt). Tái dùng pattern modal hiện có (`front/svelte/cross-slip/cross-slip-modal.svelte`, `front/svelte/common/ok-modal.svelte`). Phase sau detect viewport rộng → chuyển panel.
- Click row `account` → gọi `api_ledger.js?accountCode=<>&from=<>&to=<>` (đã có, tận dụng).
- Click row `subAccount` → truyền thêm `subAccountCode=`.
- Trong panel drill-down: button "Mở ledger đầy đủ" → `/ledger/{accountCode}?from=&to=`.
- Phase 1 chưa drill tới journal/voucher ở TB; link "Xem chứng từ" ở ledger row.

### Bilingual display

- `languagePair` đã có từ epic bilingual-foundation. Reuse `enrichBilingual` pattern.
- Modes: `ja`, `vi`, `ja-vi`, `vi-ja`. Engine nhận `languagePair`; trả `{name, nameVi, major, middle, minor, majorVi, middleVi, minorVi}` cho mỗi line. UI ghép theo mode.
- Fallback: thiếu `nameVi` → dùng `name`; thiếu `name` → `code`.
- Export: thêm 1 row header với `言語: {mode}` (label dùng `BilingualText`).

### Excel export

- Tái dùng pattern `exceljs` từ `libs/parse_accounts.js` + `front/svelte/project/project-summary.svelte`.
- File: `libs/reporting/tb-export.js` (server-side) — function `exportTrialBalance(workbook, response) → buffer`.
- Sheet `試算表_<reportType>`:
  - Row 1-3: tenant, term, period, language mode, generatedAt.
  - Row 4: column header (bilingual theo mode).
  - Row 5+: data (subtotal + account + subAccount theo thứ tự).
  - Row cuối: totals.
  - Sheet `Warnings`: nếu có.
- Number format: `#,##0;[Red]-#,##0` (theo BRD mục 10.11).
- File name: `trial_balance_{tenantCode}_{term}_{YYYYMMDDHHmm}.xlsx`.
- API: `GET /api/trial-balance/export?...` trả `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` với `Content-Disposition`.

## Risk classification

Risk flags:
- **Public contracts** — `api/trial-balance/*` thêm `version: 2`, query params mới, route mới `/export`.
- **Data model** — không migration (chỉ thêm field response).
- **Existing behavior** — frontend mới không được vỡ legacy.
- **Multi-domain** — UI + API + export.
- **Authorization** — chỉ role accounting mới xem. Reuse `requireTenant` + check role hiện có.

Hard gates: Public contracts (response shape thay đổi).
→ **Lane: high-risk**. Mỗi issue dùng `docs/templates/high-risk-story/` folder.

## Candidate stories (issues)

| # | Title | Lane | Depends on | Notes |
|---|---|---|---|---|
| 1.1 | API v2: 3 report type, filter, totals, warnings | high-risk | E0.1, E0.2 | Backbone của E1. |
| 1.2 | Subtotal builder consumer (helper, dùng chung cho UI + export) | normal | 1.1 | Library-only, không UI. |
| 1.3 | View mới `/reports/trial-balance` — 3 tab (残高/合計/合計残高) | high-risk | 1.1, 1.2 | Bilingual header, filter bar. |
| 1.4 | Hierarchy 5 cấp + expand/collapse + 補助科目 rows | high-risk | 1.2, 1.3 | Click expand/collapse, indent. |
| 1.5 | Drill-down row → ledger (modal) | normal | 1.3, ledger đã có | Sub-account truyền cả `subAccountCode`. |
| 1.6 | Warnings panel (TB-W001, W002, W005) | normal | 1.1 | Banner + highlight row. |
| 1.7 | Excel export server-side | high-risk | 1.1, 1.2, 1.6 | API `/api/trial-balance/export`. |
| 1.8 | Filter UI: term/month/account class/hide-zero/language | normal | 1.3 | Reset, hiển thị filter đang áp dụng. |
| 1.9 | Bilingual mode selector + fallback test | normal | 1.3 | Mode ja/vi/ja-vi/vi-ja. |
| 1.10 | Gỡ màn legacy `/trial-balance` + redirect sang `/reports/trial-balance` | normal | 1.3 | Sau khi màn mới stable. Remove `front/svelte/trial-balance/` (không xoá lib `trial_balance.js` — vẫn dùng bởi E0). |
| 1.11 | Reconciliation test E2E: API v2 ending == ledger sums == UI render | high-risk | 1.3, 1.4, 1.5, 1.6, 1.7 | Mocha, mocha-headless, screenshot. |

## Validation ladder

- **Unit (mocha):**
  - `libs/reporting/tb-subtotal.test.js` — subtotal = Σ con cho mọi level.
  - `libs/reporting/tb-export.test.js` — workbook có đúng sheet, header, totals.
  - `libs/reporting/warning-rules.test.js` — W001 catch mismatch, W005 catch cash âm.
- **Integration:**
  - `test/integration/trial-balance-v2.test.js` — 3 report type, filter, language.
  - Drill-down: API drill gọi đúng ledger endpoint với cùng filter.
- **E2E (manual via `npm start` + headless):**
  - Mở `/reports/trial-balance`, chọn report type, xem hierarchy, expand/collapse, drill-down, export.
  - Dùng `chrome-devtools` MCP để chụp 3 tab.
- **Reconciliation:**
  - `Σ movementDebit(trial balance v2) === Σ movementDebit(ledger sums)` cho 5 accounts random.
  - `endingBalance(v2) === endingBalance(closing.js nfy)` cho 5 BS accounts.
- **Smoke:** `npm run build` + `npm test` pass.

## Exit criteria

E1 done khi tất cả:
- [ ] API v2 trả đúng 3 report type, filter, warnings, totals, bilingual data.
- [ ] View `/reports/trial-balance` hoạt động với 3 tab, hierarchy 5 cấp, drill-down, export.
- [ ] 3 warning rule chạy đúng trong mọi scenario test.
- [ ] Excel file mở được, số liệu khớp UI, header theo language mode.
- [ ] Reconciliation test pass cho ≥ 5 accounts.
- [ ] Màn legacy vẫn chạy (E1.10 chưa thực hiện).
- [ ] Test Report đăng lên từng issue; trace ghi `harness.db`.

## Open decisions (đã chốt 2026-06-07)

1. **1.1** API v2 = **cùng endpoint `/api/trial-balance` + field `version` trong response** (`?version=2` → shape mới; không có → legacy). Handler branch theo version cho tới khi E1.10 gỡ legacy. E2 simulation gọi cùng endpoint với extra `entrySources`.
2. **1.5** Drill-down = **modal** ở phase 1 (ít đụng layout). Có thể detect viewport rộng → chuyển panel ở phase sau.
3. **1.6** W001 (debit≠credit) **không chặn export** ở phase 1: chỉ banner đỏ + ghi warning vào file Excel. Chặn = phase 2 sau user feedback.
4. **1.7** Excel sinh **server-side** (`libs/reporting/tb-export.js`, `exceljs` đã có). Cùng data source với API v2, tránh tái lặp lỗi "frontend tự tính" mà E0 vừa gỡ.
5. **1.9** Bilingual mode **không persist** ở phase 1 (chỉ session/URL). Persist vào user preference để dành E2 khi comparison cần sticky.

## Follow-up

- E2 sẽ gọi cùng API v2 với `entrySources` mở rộng → engine trả `endingBalance = actual + simulation`. Cùng subtotal builder, cùng export, cùng warnings (thêm "SIMULATION" badge trong header).
- E1.10 gỡ legacy đặt ở cuối E1 vì cần màn mới ổn trước.
- TB-006 (comparison view) và TB-007 (advanced filters: project/label) — phase 2, không thuộc E1.
