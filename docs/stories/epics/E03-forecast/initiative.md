# E03 — Forecast Simulation

> Initiative notes. Shared artifact (committed). Mapped to git branch `epic/forecast` and GitHub label `epic:forecast`.

Date: 2026-06-08
Status: in-progress
Epic issue: #260 | Branch: epic/forecast | Harness intake: #35
Lane: high-risk (sinh virtual entries hàng loạt tự động, cash projection, đụng độ probability cao với actual data)

## Goal

Mở rộng simulation từ manual journal (E2) sang dự phóng: recurring assumptions (lặp theo tháng/quý/năm), revenue growth, expense growth, và cash flow projection. Tận dụng E0 engine + E2 scenario/entry infrastructure. Tất cả assumption chỉ là wrapper sinh `SimulationEntry` — không tính toán riêng.

## Why now

- E2 đã có scenario + entry CRUD + simulated TB + comparison. Forecast chỉ thêm 1 nguồn entries tự sinh.
- Người dùng (chủ DN, manager) cần hỏi "nếu tuyển thêm 2 người thì cash có âm không?" — manual quá cồng kềnh với 6-12 tháng.
- BRD mục 11.3-11.6 đã chốt scope MVP forecast: recurring, revenue growth, expense simulation, cash projection.
- BRD mục 22.2 đã chốt: chưa làm formula engine, headcount planning, tax simulation. Tôn trọng.

## Affected product docs (to be created/updated)

- `docs/product/simulation/assumptions.md` — recurring rule, growth rule, parameter schema.
- `docs/product/simulation/cash-projection.md` — accrual vs cash, payment timing, monthly roll-forward.
- `docs/product/simulation/warnings.md` — SIM-W010 (cash âm), SIM-W011 (recurring overlap), SIM-W012 (expense không tìm thấy counter account).

## Scope

**In scope (BRD mục 11.3-11.6, MVP):**
- Recurring assumptions (SIM-003): monthly/quarterly/yearly, start/end month, day of month, optional increase rule.
- Revenue growth simulation (SIM-004): percent / fixed / manual monthly / based on prior.
- Expense simulation (SIM-005): fixed / variable / one-time / headcount-based.
- Cash flow simulation (SIM-006): opening cash + cash in/out theo payment timing.
- Simulated P/L (tổng hợp từ entries).
- Preview generated entries trước khi lưu.
- Warning: cash âm, recurring overlap (2 assumption trùng ngày + account).

**Out of scope (E3):**
- Formula engine / custom formula builder (BRD mục 11.10: "Phase sau"). Tôi cứng giữ rule: assumption chỉ sinh entry, không tính số phức tạp.
- Tax simulation (BRD cảnh báo rủi ro cao, phase 5).
- Loan repayment, headcount planning chi tiết — phase sau.
- Monte Carlo / best-base-worst (BRD mục 11.5: "không bao giờ quay về").
- Multi-scenario compare best/base/worst — phase sau.

## Architecture direction

### Data model

**`SimulationAssumption`** (mới, đã để chỗ từ E2 design):

| Field | Type | Note |
|---|---|---|
| id | INT PK | |
| tenantId | INT NOT NULL | |
| scenarioId | INT NOT NULL | FK, index |
| type | ENUM('revenue_growth','expense_fixed','expense_pct_of_sales','expense_headcount','recurring') | mở rộng được |
| name | STRING(200) | |
| parameters | JSONB | schema đặc thù theo type — xem dưới |
| startMonth | DATE | |
| endMonth | DATE | |
| status | ENUM('active','disabled') DEFAULT 'active' | |
| generatedCount | INT DEFAULT 0 | số entry đã sinh, dùng cho sync/regen |
| generatedHash | STRING(64) | hash params + period để detect thay đổi |
| createdAt, updatedAt | TIMESTAMP | |

Indexes: `(tenantId, scenarioId, type)`, `(scenarioId, status)`.

**Không thêm bảng cho cash projection.** Cash flow = derived view: engine trả entries, 1 service `cashProjection(scenarioId, periodFrom, periodTo)` group theo tháng + apply payment timing. Cache lại (in-memory hoặc `MonthlyLog`) vì recompute mỗi lần mở tab sẽ tốn.

### Assumption parameter schemas (JSONB)

Mỗi `type` có schema riêng. Validate bằng JSON schema hoặc hand-rolled check. Cố gắng giữ mỗi schema ≤ 6 trường.

```js
// recurring (SIM-003)
{
  frequency: 'monthly'|'quarterly'|'yearly',
  dayOfMonth: 1-31,                  // optional
  debitAccount, debitSubAccount?,
  creditAccount, creditSubAccount?,
  amount,                            // > 0
  taxRuleId?, projectId?, labelId?,
  memo?,
  increaseRule?: { type: 'percent'|'fixed', value }   // optional
}

// revenue_growth (SIM-004)
{
  revenueAccount,
  counterAccount,                    // 売掛金 / 普通預金
  growthType: 'percent'|'fixed'|'manual'|'avg_last_3m'|'last_month',
  growthValue,                       // number or array (manual)
  collectionTimingDays: 0|30|60|90,  // 0 = immediate cash
  taxRuleId?,
  projectId?
}

// expense_fixed (SIM-005)
{
  expenseAccount, counterAccount,
  amountType: 'fixed'|'percent_of_sales'|'headcount',
  amount?,                           // for fixed
  percentOf?: 'sales'|'cogs',        // for percent_of_sales
  // headcount (mục 3.5): 1 assumption → 2 entry (給与手当 + 法定福利費)
  headcount?: {
    count,
    salaryPerMonth,
    salaryAccount,                   // 給与手当
    insuranceAccount,                // 法定福利費
    insurancePct                     // % của (count × salaryPerMonth)
  },
  paymentTimingDays: 0|30|60,
  taxRuleId?, projectId?
}
```

### Generator service

`libs/simulation/assumption-generator.js`:

```js
async function generateEntries(assumption, scenario) {
  // Trả về SimulationEntry[] (chưa lưu DB).
  // Phase 1: hiện thực cho recurring, revenue_growth, expense_fixed.
  // expense_pct_of_sales, expense_headcount để phase 2.
}

async function preview(scenarioId) {
  // Trả entries gộp từ TẤT CẢ assumption active, chưa commit.
  // Dùng cho UI "Preview generated entries" trước khi Save.
}

async function regenerate(scenarioId) {
  // Xoá entries có sourceType IN ('recurring','formula') rồi insert lại.
  // Manual entries giữ nguyên.
  // Hash để skip nếu params không đổi.
}
```

Invariants:
- Mỗi entry sinh ra phải cân Nợ=Có (validator E2.3 đã enforce).
- Date trong `[simPeriodFrom, simPeriodTo]`.
- Nếu `endMonth` vượt `simPeriodTo`, chỉ sinh tới `simPeriodTo`.
- Ngày không tồn tại trong tháng (vd 31/2) → dùng ngày cuối tháng.
- Recurring + recurring trùng `account + date + amount` → cảnh báo SIM-W011 (không chặn).

### Cash projection

> Phân loại cash / receivable / payable **derive từ `AccountClass.major/middle`** (mục 3.8 đã chốt) — KHÔNG từ số `field(code)`. Danh sách mapping chính xác chốt ở story 3.8 sau khi đọc seed `AccountClass` thực tế.

```js
async function cashProjection(scenarioId, periodFrom, periodTo) {
  // 1. Opening cash = endingBalance(các account có AccountClass.middle = '現金及び預金' …) tại periodFrom-1.
  //    Lấy từ engine actual + simulation entries tới periodFrom-1.
  // 2. Lấy TẤT CẢ entries (manual + generated) trong [periodFrom, periodTo].
  // 3. Với mỗi entry:
  //    - accrual impact: vào tháng `entry.date` (group by month).
  //    - cash impact: classify account qua AccountClass:
  //        cash/bank   → immediate
  //        receivable  → shift theo collectionTimingDays
  //        payable     → shift theo paymentTimingDays
  // 4. Trả [{ month, openingCash, cashIn, cashOut, netFlow, endingCash, accrualProfit }].
}
```

Service trả cả accrual lẫn cash, để UI hiển thị 2 cột (theo BRD BR-SIM-007: "tách khỏi accrual profit").

Cảnh báo SIM-W010: nếu `endingCash < 0` ở bất kỳ tháng nào → flag tháng đó đỏ.

### API

```
# Assumptions CRUD
GET    /api/simulation/scenarios/:id/assumptions
POST   /api/simulation/scenarios/:id/assumptions
PATCH  /api/simulation/scenarios/:id/assumptions/:aid
DELETE /api/simulation/scenarios/:id/assumptions/:aid
POST   /api/simulation/scenarios/:id/assumptions/:aid/preview     # entries sẽ sinh

# Generator
POST   /api/simulation/scenarios/:id/regenerate                    # xoá + insert lại entries từ assumption
POST   /api/simulation/scenarios/:id/preview-all                   # tổng tất cả assumption

# P/L
GET    /api/simulation/scenarios/:id/pl?periodFrom=&periodTo=      # simulated P/L

# Cash flow
GET    /api/simulation/scenarios/:id/cash-flow?periodFrom=&periodTo=
```

### UI

Scenario detail (E2.7) tab **Assumptions** thay placeholder bằng:
- Bảng list assumption (type, name, period, status, generatedCount).
- Button "+ Assumption" → wizard theo type (form dynamic theo JSONB schema).
- Mỗi row có button "Preview" → modal hiển thị entries sẽ sinh (date, accounts, amount, memo).
- Button "Regenerate all" trên header tab → xoá generated entries + insert lại.

Tab **P/L** mới: bar chart thu/chi theo tháng + summary. Library: Svelte native SVG hoặc dùng 1 lib chart nhẹ (chưa có — chốt ở Open Q #5).

Tab **Cash** mới: line chart cash balance 12 tháng, highlight tháng âm.

Bilingual + badge "SIMULATION" từ E2 giữ nguyên.

### Permission

E2 đã có `simulation:create/view/export`. E3 chỉ thêm:
- `simulation:regenerate` (admin/accountant) — trigger xoá + insert entries tự động.
- Không cần permission mới cho assumption CRUD vì kế thừa `simulation:create`.

## Risk classification

Risk flags:
- **Data model** — 1 bảng mới + JSONB (cẩn thận validation).
- **Public contracts** — `/api/simulation/.../assumptions`, `/pl`, `/cash-flow`.
- **Existing behavior** — generator xoá entries (dù chỉ generated) — phải backup trước khi xoá.
- **Multi-domain** — UI + service + chart.
- **Audit/security** — regenerate = destructive, audit log entry nào bị xoá.

Hard gates: Audit/security, Public contract mới.
→ **Lane: high-risk**.

## Candidate stories (issues)

| # | Issue | Title | Lane | Depends on | Notes |
|---|---|---|---|---|
| 3.1 | #261 | Migration + model `SimulationAssumption` | high-risk | E2.1 | JSONB parameters, indexes. |
| 3.2 | #263 | Assumption CRUD API + JSON schema validate theo type | high-risk | 3.1 | 3 type phase 1: recurring, revenue_growth, expense_fixed. |
| 3.3 | #264 | Generator service: sinh `SimulationEntry` từ recurring | high-risk | 3.1, E2.3 | Monthly/quarterly/yearly + day-of-month edge case. |
| 3.4 | #265 | Generator: revenue_growth (percent/fixed/manual/avg/last) | high-risk | 3.3 | Collection timing tạo offset cash entry. |
| 3.5 | #266 | Generator: expense_fixed (fixed/percent-of-sales/headcount) | high-risk | 3.3 | Headcount chỉ cần basic count × salary; phase 2 nếu muốn phức tạp hơn. |
| 3.6 | #267 | Preview API (1 assumption hoặc all) | high-risk | 3.3, 3.4, 3.5 | Không ghi DB, chỉ trả danh sách. |
| 3.7 | #268 | Regenerate API: xoá generated entries + insert lại, audit log | high-risk | 3.6, E2.13 | Manual entries giữ nguyên. |
| 3.8 | #269 | Cash projection service + API | high-risk | 3.7 | Tách accrual vs cash theo payment timing. |
| 3.9 | #270 | Simulated P/L API | high-risk | 3.7 | Group revenue/expense entries theo tháng. |
| 3.10 | #271 | UI: tab Assumptions + wizard form theo type | high-risk | 3.2, 3.6 | Dynamic form dựa JSONB schema. |
| 3.11 | #272 | UI: tab P/L + tab Cash (chart 12 tháng) | high-risk | 3.8, 3.9 | Native Svelte SVG (xem Open Q #5). |
| 3.12 | #273 | Warning SIM-W010/W011/W012 | normal | 3.8, 3.6 | Highlight row đỏ, banner scenario. |
| 3.13 | #262 | Permission `simulation:regenerate` | normal | E2.12 | 1 quyền mới. |
| 3.14 | #274 | Reconciliation: regenerated entries sum = manual comparable | high-risk | 3.7 | Mocha, kiểm tra hash skip đúng. |

## Validation ladder

- **Unit (mocha):**
  - `test/simulation/recurring-generator.test.js` — frequency monthly sinh đúng số entry, day-of-month 31/2 → ngày cuối tháng.
  - `test/simulation/revenue-growth.test.js` — percent vs fixed vs avg_last_3m đúng.
  - `test/simulation/expense-fixed.test.js` — fixed, percent-of-sales, headcount (count × salary).
  - `test/simulation/cash-projection.test.js` — collection timing offset, accrual vs cash.
  - `test/simulation/json-schema.test.js` — invalid JSONB bị reject.
- **Integration:**
  - Tạo scenario E2, thêm recurring, regenerate, kiểm tra entries xuất hiện trong simulated TB.
  - Edit assumption → regenerate → entries cũ bị xoá + mới được insert + manual entries giữ.
- **E2E (chrome-devtools MCP):**
  - Tạo scenario "2026 H2 Hiring", thêm salary recurring 6 tháng, xem TB + cash projection, chụp.
  - Đổi salary 500k → 700k, regenerate, chụp diff.
- **Reconciliation:**
  - Σ generated entries = Σ manual entries (nếu cùng params).
  - Cash projection tháng cuối = opening + Σ cash in - Σ cash out.
- **Smoke:** `npm run build` + `npm test` pass.

## Exit criteria

E3 done khi tất cả:
- [ ] Assumption CRUD + 3 generator type hoạt động.
- [ ] Preview + Regenerate đúng, manual entries không bị động vào.
- [ ] Cash projection + simulated P/L khớp engine, cảnh báo cash âm.
- [ ] UI wizard + 2 chart tab hoạt động, bilingual, badge simulation.
- [ ] Audit log cover mọi thay đổi (assumption CRUD + regenerate).
- [ ] Test Report đăng lên từng issue; trace ghi `harness.db`.

## Open decisions (đã chốt 2026-06-07)

1. **3.1** JSONB parameters validate bằng **Ajv** (thêm dep mới). Schema khai báo rõ ràng, tái dùng được khi số `type` phình ở phase sau.
2. **3.5** Headcount expense: **1 assumption → 2 entry** (給与手当 + 法定福利費 = % của lương), khớp ví dụ BRD mục 24.1. % bảo hiểm là tham số trong `parameters.headcount`.
3. **3.6** Preview **không cho edit** entry trực tiếp. Generated entries thuần từ assumption; muốn khác → sửa assumption hoặc clone thành manual entry.
4. **3.7** Regenerate **không snapshot** phase 1. Chỉ xoá *generated* entries (manual giữ nguyên), audit log đủ forensic, có thể regenerate lại từ assumption bất cứ lúc nào.
5. **3.11** Chart = **native Svelte SVG** (0 dep): 1 line chart cash + 1 bar chart P/L đơn giản. Không thêm chart.js/echarts.
6. **3.8** Phân loại cash/receivable/payable **derive từ `AccountClass.major/middle`** (KHÔNG từ số `field(code)` thô). ⚠️ Đã verify: hệ thống phân loại BS/PL bằng `AccountClass` (資産/負債, 流動資産/流動負債...) trong `libs/init-financial-statement.js`, không phải bằng `field()` số. Mapping cụ thể (vd middle='現金及び預金' → cash; major='負債' + account chứa '売掛/未収' → receivable) cần **chốt danh sách chính xác ở story 3.8** sau khi đọc seed `AccountClass` thực tế của tenant. Không hard-code field number.
7. **3.12** SIM-W011 (recurring overlap) = **warning low, không chặn**. Gộp duplicate hiển thị trong preview, user tự quyết (có thể là intent hợp lệ).

## Follow-up (sang epic sau — phase 2)

- Formula engine / custom expression (BRD mục 11.10).
- Tax estimate (BRD mục 11.7).
- Multi-scenario compare best/base/worst (BRD mục 11.5).
- Convert simulation → actual journal với approval workflow (BRD Open Q #8) — cân nhắc kỹ trước khi làm.
- Phase 2 reports: monthly trend, project/label filter ở trial balance (E1 mục TB-010/TB-007 advanced).
