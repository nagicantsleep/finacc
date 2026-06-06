# E02 — Simulation MVP (Manual Journal)

> Initiative notes. Shared artifact (committed). Mapped to git branch `epic/simulation` and GitHub label `epic:simulation`.

Date: 2026-06-07
Status: proposed
Lane: high-risk (new domain, multi-tenant data isolation, public contract mới, đụng độ xác suất với actual data)

## Goal

Cho phép tạo scenario simulation chứa virtual journal entries (mirror `CrossSlipDetail`), xem simulated 試算表 và actual-vs-simulated comparison, hỗ trợ clone/archive/lock, và export Excel với badge rõ ràng "không phải dữ liệu kế toán chính thức". Tận dụng reporting engine (E0) và trial balance view (E1) — không viết calculation riêng.

## Why now

- E0 đã chốt `entrySources` contract cho phép inject virtual entries.
- E1 đã có API v2 + UI + export — simulation chỉ thêm nguồn dữ liệu + tab "Simulation" trong cùng view.
- Người dùng (chủ DN, kế toán) cần dự phóng trước khi quyết định tuyển người / tăng giá / cắt chi phí. Hiện không có công cụ nào trong app.
- Đã có BRD ở `new_feature_brainstorm_result.md` (mục 11.1–11.10) — simulation MVP scope đã chốt ở BRD mục 22.2 (manual journal trước, forecast sau).

## Affected product docs (to be created/updated)

- `docs/product/simulation/concepts.md` — scenario, virtual entry, actual vs simulation, lock state, badge rule.
- `docs/product/simulation/data-model.md` — `SimulationScenario`, `SimulationEntry` schema + tenant scoping.
- `docs/product/simulation/permissions.md` — ai tạo/clone/lock/export được gì.
- `docs/product/simulation/ui-flow.md` — list / detail / TB tab / comparison tab.
- Update `docs/product/reporting/warnings.md` — thêm SIM-W001..W005 (TB-W001 ngữ cảnh simulation).

## Scope

**In scope (BRD mục 22.2):**
- Scenario CRUD (tạo, sửa ở draft, clone, archive, lock).
- Virtual journal entries: cân bằng Nợ/Có, amount > 0, debit≠credit, có memo/project/label/sub-account.
- Simulated 試算表: gọi engine với `entrySources = [actual, simulation]`, dùng cùng subtotal builder + export từ E1.
- Actual vs simulated comparison (TB-007 trong BRD): cột actual / adjustment / simulated / difference / difference%.
- Clone scenario tạo bản độc lập.
- Lock scenario: không sửa entries/assumptions/period; clone ra draft mới.
- Excel export scenario với header ghi rõ "SIMULATION - NOT OFFICIAL ACCOUNTING REPORT" + lock timestamp nếu có.
- Tenant isolation + role-based permission.

**Out of scope (E2):**
- Recurring assumptions (SIM-003) — E3.
- Revenue growth / expense growth / cash projection (SIM-004/005/006) — E3.
- `SimulationAssumption` table — chưa cần; E2 chỉ lưu `SimulationEntry` raw.
- Tax estimate (SIM optional) — phase sau.
- Convert simulation → actual journal — **KHÔNG** trong MVP, BRD Open Q #8 đã cảnh báo "tránh tai nạn kế toán".
- Multi-scenario compare (best/base/worst) — phase sau.
- Budget integration — phase sau.

## Architecture direction

### Data model

**`SimulationScenario`** (mới):

| Field | Type | Note |
|---|---|---|
| id | INT PK | |
| tenantId | INT NOT NULL | index, FK |
| name | STRING(200) NOT NULL | |
| description | TEXT | nullable |
| baseTerm | INT NOT NULL | term chứa actual data dùng làm nền |
| basePeriodFrom | DATE NOT NULL | thường = fy.startDate |
| basePeriodTo | DATE NOT NULL | mặc định = fy.endDate |
| simPeriodFrom | DATE NOT NULL | ≥ basePeriodTo+1 |
| simPeriodTo | DATE NOT NULL | > simPeriodFrom |
| status | ENUM('draft','locked','archived') DEFAULT 'draft' | |
| ownerId | INT NOT NULL | FK user |
| visibility | ENUM('private','shared') DEFAULT 'private' | |
| lockedAt | DATE | nullable |
| lockedBy | INT | FK user, nullable |
| createdAt, updatedAt | TIMESTAMP | |

Indexes: `(tenantId, status)`, `(tenantId, ownerId)`.

**`SimulationEntry`** (mới, mirror `CrossSlipDetail` không có approved):

| Field | Type | Note |
|---|---|---|
| id | INT PK | |
| tenantId | INT NOT NULL | |
| scenarioId | INT NOT NULL | FK, index |
| date | DATE NOT NULL | trong [simPeriodFrom, simPeriodTo] |
| debitAccount | STRING(20) NOT NULL | FK accountCode |
| debitSubAccount | INT | FK subAccount, nullable |
| debitAmount | DECIMAL(12) NOT NULL | > 0 |
| creditAccount | STRING(20) NOT NULL | |
| creditSubAccount | INT | nullable |
| creditAmount | DECIMAL(12) NOT NULL | > 0 |
| taxRuleId | INT | nullable, FK |
| projectId | INT | nullable, FK |
| labelId | INT | nullable, FK |
| memo | STRING(500) | |
| sourceType | ENUM('manual') DEFAULT 'manual' | E3 sẽ thêm 'recurring' |
| createdAt, updatedAt | TIMESTAMP | |

Constraint: `debitAmount > 0`, `creditAmount > 0`, `debitAmount = creditAmount` (validate ở app layer), `debitAccount ≠ creditAccount`. KHÔNG có `approvedAt` (BR-SIM-001).

**Không tạo `SimulationAssumption`** ở E2 — E3 sẽ thêm.

### Routes / API

```
# Scenario CRUD
GET    /api/simulation/scenarios                  list
POST   /api/simulation/scenarios                  create
GET    /api/simulation/scenarios/:id              detail (with entries)
PATCH  /api/simulation/scenarios/:id              update (draft only)
POST   /api/simulation/scenarios/:id/clone        clone → new draft
POST   /api/simulation/scenarios/:id/lock         lock
POST   /api/simulation/scenarios/:id/archive      archive
POST   /api/simulation/scenarios/:id/unlock       unlock (admin only)

# Virtual entries
GET    /api/simulation/scenarios/:id/entries
POST   /api/simulation/scenarios/:id/entries
PATCH  /api/simulation/scenarios/:id/entries/:eid
DELETE /api/simulation/scenarios/:id/entries/:eid

# Reports
GET    /api/simulation/scenarios/:id/trial-balance?reportType=...&month=...&languagePair=...
GET    /api/simulation/scenarios/:id/comparison?reportType=...&month=...&languagePair=...
GET    /api/simulation/scenarios/:id/export?type=trial-balance|comparison|full
```

Reports **không tạo engine riêng** — gọi lại `balanceEngine()` của E0 với `entrySources` mở rộng.

### Engine contract (E0 + E2)

```js
balanceEngine({
  tenantId, term, period,
  entrySources: [
    { name: 'actual',     fetch: () => CrossSlipDetail (approved) },
    { name: 'simulation', fetch: () => SimulationEntry, scenarioId }
  ],
  options: { reportType, includeUnapproved: false, ... }
})
// Output.lines[i].endingBalance = actual + simulation adjustment
// Output.meta.entrySourceNames = ['actual','simulation']
```

Engine không biết gì về "scenario" — nó chỉ nhận thêm 1 nguồn. Service layer (`simulation/trial-balance.js`) tạo fetcher từ `SimulationEntry`.

### UI

Màn `/reports/trial-balance` từ E1 thêm 1 dropdown **"Mode"**: `Actual | Simulation`.

- Khi chọn `Simulation`:
  - Dropdown phụ chọn scenario (chỉ draft/locked, không archived).
  - Banner đỏ: "SIMULATION - NOT OFFICIAL ACCOUNTING REPORT" + tên scenario.
  - Warning list có thêm SIM-W001 (simulation total không cân: gần như không thể vì validate ở entry layer, nhưng vẫn check), SIM-W002 (scenario lock bị bỏ qua bởi admin: cảnh báo trước khi xem).
  - Export: ghi rõ "Simulation: <name>, Status: <draft|locked>, Not for tax filing".

**Màn mới** `/simulation/scenarios` (list + create button) và `/simulation/scenarios/:id` (detail với tabs: Assumptions (placeholder cho E3), Entries, Trial Balance, Comparison, Export).

### Comparison report (SIM-007)

API trả:

```json
{
  "meta": { "scenarioId", "term", "period", "languageMode", "generatedAt" },
  "lines": [{
    "type": "subtotal|account|subAccount",
    "code", "name", "nameVi", ...,
    "actual": { "movementDebit", "movementCredit", "endingBalance" },
    "adjustment": { "movementDebit", "movementCredit", "endingBalance" },
    "simulated": { "movementDebit", "movementCredit", "endingBalance" },
    "difference": "simulated.endingBalance - actual.endingBalance",
    "differencePct": "..."
  }],
  "totals": { ... },
  "warnings": [...]
}
```

Logic: chạy engine 2 lần (chỉ actual; actual+simulation) rồi diff. Cùng subtotal builder. Reuse export từ E1 với thêm sheet "Comparison".

### Permission

Roles (mở rộng từ hệ thống hiện tại, BRD mục 14.1):

| Role | E2 quyền |
|---|---|
| Admin | Full |
| Accountant | Create / edit / clone / lock (own + shared) / export |
| Manager | Create / edit own scenario; view shared; clone |
| Viewer | View shared scenario only |
| 税理士 | View shared scenario + export (no create) |

Implement: thêm 1 permission string `simulation:create`, `simulation:lock`, `simulation:export`. Reuse `is_authenticated` + `requireTenant` middleware. Authorize ở route layer; UI ẩn nút theo permission.

**Lưu ý:** Phase 1 chỉ phân biệt `canCreate` / `canView` / `canExport`. Quyền chi tiết hơn (vd salary simulation riêng) để phase sau.

### Audit

- Mỗi thay đổi scenario (create/update/clone/lock/archive/entry CRUD) ghi bảng **`AuditEvent`** (bảng dùng chung tạo ở E0.4 — mục 2.13 đã chốt) với `action='simulation:<verb>'`, `entityType='SimulationScenario'|'SimulationEntry'`, `entityId`, `tenantId`, `actorId`, payload gọn (chỉ id + diff, không lưu toàn bộ entry).
- `AuditEvent` cần index phụ `(entityType, entityId)` để query nhanh theo scenarioId. Nếu E0 chưa thêm index này, E2.13 bổ sung migration.

## Risk classification

Risk flags:
- **Data model** — 2 bảng mới + migration.
- **Auth/Authorization** — permission mới.
- **Public contracts** — `/api/simulation/*` mới hoàn toàn.
- **Cross-platform** — UI mới `/simulation/*`.
- **Existing behavior** — mở rộng E0 engine contract (additive, không phá).
- **Multi-domain** — simulation + reporting.
- **Audit/security** — virtual entries KHÔNG được lẫn actual; tenant isolation; export có sensitive data.

Hard gates: Authorization, Data isolation, Audit/security.
→ **Lane: high-risk**. Mỗi issue dùng `docs/templates/high-risk-story/` folder.

## Candidate stories (issues)

| # | Title | Lane | Depends on | Notes |
|---|---|---|---|---|
| 2.1 | Migrations + models `SimulationScenario`, `SimulationEntry` | high-risk | — | Tenant-scoped, indexes, constraints. |
| 2.2 | Scenario CRUD API + service layer | high-risk | 2.1 | Lock/clone/archive logic. |
| 2.3 | Virtual entry CRUD API + balance validator (Nợ=Có) | high-risk | 2.1 | Reject nếu không cân, amount ≤ 0, debit=credit. |
| 2.4 | Simulated TB API: gọi engine với 2 entrySources | high-risk | 2.2, 2.3, E0.1 | Reuse API v2 shape từ E1.1. |
| 2.5 | Comparison API (SIM-007) | high-risk | 2.4 | Engine 2 lần + diff. |
| 2.6 | Scenario list + create form UI (`/simulation/scenarios`) | normal | 2.2 | Bilingual. |
| 2.7 | Scenario detail UI (`/simulation/scenarios/:id`) — 4 tabs (placeholder cho Assumptions) | high-risk | 2.6, 2.3, 2.4, 2.5 | Banner "SIMULATION - NOT OFFICIAL" trên header. |
| 2.8 | Trial Balance tab: tích hợp vào view E1 với mode=Simulation | high-risk | 2.4, E1.3 | Dropdown scenario, banner đỏ. |
| 2.9 | Comparison tab: render comparison data | high-risk | 2.5, 2.7 | Diff color: xanh = tăng, đỏ = giảm. |
| 2.10 | Lock UI + clone UI | normal | 2.2 | Modal confirm cho lock. |
| 2.11 | Excel export scenario (TB + comparison + entries) | high-risk | 2.4, 2.5 | Header có badge simulation, lock timestamp. |
| 2.12 | Permission: `simulation:create/view/export` + middleware | high-risk | — | Audit cũng dùng. |
| 2.13 | Audit log: ghi mọi thay đổi scenario/entry vào `AuditEvent` (bảng E0.4) | high-risk | 2.2, 2.3, 2.12, E0.4 | Dùng chung `AuditEvent`; thêm index `(entityType, entityId)` nếu thiếu. |
| 2.14 | Tenant isolation test: scenario của tenant A không hiển thị/đọc được từ tenant B | high-risk | 2.2, 2.4 | Mocha, supertest chéo tenant. |
| 2.15 | Reconciliation: simulated TB = actual TB + virtual entries (sum) | high-risk | 2.4 | Engine 2 lần verify diff. |

## Validation ladder

- **Unit (mocha):**
  - `test/simulation/entry-validator.test.js` — Nợ=Có, amount>0, debit≠credit, date trong period.
  - `test/simulation/scenario-state.test.js` — draft ↔ locked ↔ archived transition.
  - `test/simulation/comparison-calc.test.js` — diff tính đúng với dataset fixture.
- **Integration:**
  - `test/integration/simulation-crud.test.js` — create → entry → simulated TB đúng.
  - `test/integration/simulation-export.test.js` — file Excel có badge + lock ts.
  - `test/integration/simulation-tenant-isolation.test.js` — 2 tenant, request chéo → 404/403.
- **E2E (chrome-devtools MCP):**
  - Tạo scenario, thêm 3 entries, mở TB mode=Simulation, chụp screenshot.
  - Clone, lock, archive.
  - Export, mở file Excel, xác nhận header.
- **Reconciliation:**
  - `simulated.endingBalance(account) = actual.endingBalance(account) + Σ virtual entries(account)`.
  - `Σ simulated.movementDebit = Σ simulated.movementCredit` (luôn cân vì entry đã validate).
- **Smoke:** `npm run build` + `npm test` pass.

## Exit criteria

E2 done khi tất cả:
- [ ] 2 models + migrations + indexes đã merge.
- [ ] Scenario CRUD + entry CRUD + clone/lock/archive chạy đúng, audit log đầy đủ.
- [ ] Simulated TB = actual + virtual entries, drill-down có badge phân biệt.
- [ ] Comparison hiển thị đúng actual / adjustment / simulated / diff.
- [ ] Export có badge "SIMULATION - NOT OFFICIAL", file mở được, số liệu khớp UI.
- [ ] Tenant isolation test pass.
- [ ] Permission đúng theo role matrix.
- [ ] Không có virtual entry nào lọt vào `api_ledger`/`api_trial-balance` (actual mode).
- [ ] Test Report đăng lên từng issue; trace ghi `harness.db`.

## Open decisions (đã chốt 2026-06-07)

1. **2.1** `SimulationEntry` **không copy** `application1`/`application2` từ `CrossSlipDetail`. `memo` đủ cho simulation; thêm cột sau nếu cần (migration rẻ).
2. **2.13** Audit dùng **bảng chung `AuditEvent`** (tạo ở E0.4) — không tạo `SimulationAudit` riêng. Query theo `(entityType, entityId)`. Nhất quán với closing audit, đỡ maintain 2 bảng.
3. **2.6/2.7** Scenario list **có filter**: status, owner, date range. Bỏ search free-text ở phase 1.
4. **2.8** Mode=Simulation **sticky per session** khi đổi account/tháng. Banner đỏ luôn hiện để không nhầm với actual.
5. **2.12** Permission **hard-code trong `libs/auth/permissions.js`** (map role → `simulation:create/view/export`). Không tạo schema RBAC ở phase này.
6. **2.14** Test chéo tenant chạy trên **test DB + Sequelize transaction rollback** (không stub). Isolation phải test thật tầng query.

## Follow-up (sang E3)

- E3 sẽ thêm `SimulationAssumption` table, recurring engine, revenue/expense growth, cash projection.
- Simulation entry lúc đó có thêm `sourceType='recurring'`, E0 engine không cần đổi.
- Có thể thêm 1 endpoint E2 làm nền: `GET /api/simulation/scenarios/:id/assumptions/preview` trả entries sẽ sinh ra (E3 dùng).
- BRD Open Q #8 (convert simulation → actual journal) — **không làm** trong MVP. Nếu khách hàng yêu cầu, làm riêng epic sau với workflow approval rất rõ.
