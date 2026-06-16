# Plan: DB Mapping / Connection / Seeding / Tenant Init Hardening

> **Trạng thái:** READY để tạo epic/issues và triển khai theo thứ tự bên dưới. Đây là readiness plan, chưa triển khai code.
> **Ngày:** 2026-06-15
> **Epic đề xuất:** `epic/db-tenant-hardening`
> **Phạm vi:** Hardening 4 vùng: database mapping, connection/session security, seeding contract, tenant data initialization.

---

## 0. Đính chính audit round 1

Audit round 1 nêu 4 mục Critical. Sau khi đối chiếu git/source hiện tại, 2 mục là false positive, 1 mục cần hạ mức và viết lại bằng chứng, 1 mục vẫn đúng.

| Claim ban đầu | Kết luận hiện tại | Bằng chứng và xử lý |
|---|---|---|
| Plaintext production password commit trong repo | Không có secret đang tracked; không kết luận "chưa từng commit" | `config/config.json` hiện bị ignore (`.gitignore`) và `git ls-files config/config.json` rỗng. Tuy nhiên `git log --all -- config/config.json` có lịch sử cũ (`1eef6b0`, `5c62b6f`, `058a722`) với placeholder content, nên claim "git log rỗng/chưa từng commit" là sai. Việc cần làm: không coi đây là Critical active leak, nhưng vẫn giữ config hardening để tránh local secret bị add nhầm. |
| `.env` có `DB_*` nhưng không được dùng | False positive cho Docker flow, còn thiếu local-dev UX | `bin/check-config:8-13,37-47` đọc `process.env.DB_*` và generate `config/config.json` từ sample khi chạy `bin/docker-www`. `npm start` non-Docker không chạy `check-config`, nên cần document hoặc thêm script setup local. |
| Bootstrap thiếu AccountClass/Menu/FiscalYear/master data | False positive nếu hiểu tenant lifecycle là 2 pha | Pha 1 bootstrap tạo `Tenant`, `TenantMember`, `CompanyClass`, `Company`. Pha 2 setup wizard `POST /api/setup` tạo `FiscalYear`, `AccountClass`, `Account`, `AccountRemaining`, `SubAccount`, `SubAccountRemaining`, `Menu`, rồi set `session.term`. |
| `createOwnedTenant` duplicate với `bootstrapTenantMember` | Đúng | `routes/api_user.js:25-66` copy logic seed từ `libs/bootstrap.js:38-103`, có drift risk. |

**Hệ quả:** Không triển khai theo hướng "thiếu toàn bộ master seed" hoặc "rotate leaked committed password" trong epic này. Epic tập trung vào hardening thật còn lại: auth/session safety, config robustness, tenant mapping contract, DRY bootstrap, constraint integrity, và proof cho init 2 pha.

---

## 1. Bối cảnh kiến trúc đã xác minh

Readiness pass 2026-06-15 đã đối chiếu lại với source hiện tại và Harness/GitNexus:

- `scripts/bin/harness-cli.exe query matrix` chạy được từ project root; matrix đã có proof lịch sử cho multitenant/simulation và Harness 0.1.9.
- `gitnexus_query` tìm đúng surface tenant/setup/translation và `gitnexus_context(bootstrapTenantMember)` xác nhận direct caller hiện tại là `routes/api_user.js`.
- `git status --short --branch` đang ở `main...origin/main`; file plan này là thay đổi untracked duy nhất trước readiness edit.

### Startup flow

```text
Docker:
bin/docker-www
  -> bin/check-config   # đọc DB_* env -> generate config/config.json từ sample
  -> bin/check-db       # tạo DB nếu chưa có -> chạy migrations
  -> bin/www            # khởi động app; app startup cũng gọi checkDatabase/applyMigration

Non-Docker:
npm start
  -> cross-env NODE_ENV=production node ./bin/www
  -> không chạy check-config/check-db wrapper trước
```

Local non-Docker cần có `config/config.json` sẵn. Plan sẽ thêm script/documentation để không phụ thuộc tribal knowledge.

### Tenant lifecycle 2 pha

```text
Phase 1 - bootstrap tenant shell
libs/bootstrap.js bootstrapTenantMember
routes/api_user.js createOwnedTenant
  -> Tenant.create
  -> TenantMember.create(owner, all permissions)
  -> CompanyClass x 8
  -> Company "本社"

Phase 2 - setup wizard
GET /setup: routes/home.js redirect/render khi tenant chưa có FiscalYear
POST /api/setup: routes/api_setup.js
  -> FiscalYear.create
  -> AccountClass/Account/AccountRemaining/SubAccount/SubAccountRemaining từ parse_accounts
  -> Menu từ config/menu-template.cjs
  -> company.roundingMethod
  -> req.session.term
```

### DB mapping hiện tại

- `models/index.js` import 40 models và gọi `associate` sau khi init toàn bộ model.
- Đa số business models có `tenantId NOT NULL`.
- `TenantMember` và simulation models có `belongsTo(models.Tenant)`; đa số tenant-scoped models còn lại không có `belongsTo(Tenant)`.
- Static scan 2026-06-15: 38 model files có `tenantId`; 4 model có `belongsTo(models.Tenant)`; 33 model có `tenantId allowNull:false` nhưng chưa có tenant association; `Translation` có `tenantId` nullable và không thuộc guard mặc định.
- Route/service layer dùng manual scoping rất nhiều (`where: { tenantId }`, `req.currentTenantId`). Đây là contract hiện tại, nhưng cần được codify bằng helper/test hoặc bổ sung associations có kiểm soát.
- DB có tenant FK hardening: `20260330030000-add-tenantid-fk-constraints.cjs`, `20260401000000-composite-tenant-fk-constraints.cjs`, `20260402000000-harden-multitenant-invariants.cjs`.
- `Tenant.status` và `TenantMember.status` là free string, chưa có model enum validation hoặc DB CHECK.

### Seeding hiện tại

- Không có `seeders/` và không có `bin/seed.js`.
- Có data seed trong migrations cũ cho master tables (`ItemClasses`, `MemberClasses`, `VoucherClasses`, `TransactionKinds`, `CompanyClasses`, `Menus`, `TaxRules`) và translation migrations (`20260602*`, `20260604*`, `20260606*`).
- Multi-tenant migrations backfill legacy master rows sang legacy tenant. Fresh tenant không lấy master seed global, mà dùng setup wizard cho tenant-specific chart/menu.
- Vì vậy vấn đề đúng không phải "không có master data", mà là: không có cơ chế re-seed rõ ràng, chưa document init 2 pha, và test còn tự tạo tenant/master data thủ công.

---

## 2. Vấn đề hợp lệ còn lại

| # | Mức | Vấn đề | Nguồn |
|---|---|---|---|
| V1 | High | `createOwnedTenant` duplicate seed logic với `bootstrapTenantMember`, dễ drift | `routes/api_user.js:25-66`, `libs/bootstrap.js:38-103` |
| V2 | High | DB config sample/check-config thiếu pool, SSL, statement timeout, application name, `DB_PORT`, local setup path | `config/config.json.sample`, `bin/check-config`, `package.json` |
| V3 | High | CORS `origin:['*']`, cookie `secure:false`, thiếu `sameSite`, `maxage` typo, `expressSecret` fallback production | `app.js:41-67`, `config/env.js:30` |
| V4 | High | Session store chưa có schema handling đúng API nếu dùng non-public schema; `connect-pg-simple` dùng top-level `schemaName`, không phải field trong `conObject` | `app.js:51-61`, `node_modules/connect-pg-simple/README.md` |
| V5 | High | `Tenant.status`/`TenantMember.status` không có enum validation hoặc DB CHECK | `models/tenant.js`, `models/tenantmember.js`, migrations |
| V6 | High | Race khi tạo tenant trùng slug/name: pre-check không atomic, DB unique reject thành 500/message thô | `routes/api_user.js:34-45`, `routes/api_user.js:543-549` |
| V7 | Medium | `models/index.js` đọc `config/config.json` bằng cwd-relative path | `models/index.js:48` |
| V8 | High | Tenant mapping policy chưa khép kín: manual scoping là chuẩn hiện tại nhưng không có helper/association policy/test guard đủ rõ | `models/*.js`, `routes/*.js`, `libs/*.js` |
| V9 | Medium | `Translation.fetchBatch` mô tả tenant override nhưng production path `enrichBilingual` system-only (`tenantId:null`); invariant tenant/system chưa được quyết định rõ | `models/translation.js`, `libs/bilingual-helper.js` |
| V10 | Low | `slugFromName` suffix chỉ timestamp, thiếu random entropy | `libs/bootstrap.js:19-27` |
| V11 | Low | Debug logs còn sót trong production routes | `app.js:84-85,101`, thêm cleanup opportunistic cho nearby noisy auth logs nếu cùng issue |
| V12 | Medium | Test tenant setup rải rác, thiếu helper chuẩn; init 2 pha chưa document đủ | `test/simulation/*.test.mjs`, `docs/ARCHITECTURE.md`, `README.md` |

---

## 3. Risk lane mặc định

Theo `docs/FEATURE_INTAKE.md`, các hard gate gồm Auth, Authorization, migration, audit/security. Vì epic này chạm session/auth, tenant authorization scope, DB schema/migrations và security config, các issue chính dùng high-risk lane trừ cleanup thuần túy.

Không triển khai code trước khi tạo GitHub issue. Tất cả code issue đều cần:

- GitHub issue trước.
- Harness intake sau issue.
- Story folder high-risk nếu lane high-risk.
- `gitnexus_impact` trước khi sửa symbol.
- `gitnexus_detect_changes` trước commit.
- Test Report post lên issue.

---

## 4. Phân rã issue sẵn triển khai

### ISSUE A - Connection, session, CORS, secret hardening `[High-risk]`

**Gồm:** V2, V3, V4

**Mục tiêu:** Production không chạy với wildcard CORS, insecure cookie, default secret, hoặc session schema config giả. DB config generated từ env đủ thông số vận hành cơ bản.

**Files dự kiến:**

- `config/config.json.sample`
- `bin/check-config`
- `bin/docker-www`
- `app.js`
- `config/env.js`
- focused tests for env/config/session/CORS behavior
- `README.md` hoặc docs local setup liên quan

**Implementation notes:**

- Thêm config sample cho `port`, `pool`, `dialectOptions.statement_timeout`, `dialectOptions.application_name`.
- `bin/check-config` đọc thêm `DB_PORT`, `DB_SSL`, optional pool/timeout env nếu cần. Nếu implement nested JSON từ env, dùng parser rõ ràng, không string replace.
- Nếu `bin/check-config` thêm required/optional env mới, đồng bộ `bin/docker-www` required-var gate và README local setup; hiện wrapper chỉ gate `NODE_ENV`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`.
- Production SSL default: `rejectUnauthorized: true`. Nếu self-signed staging cần override env riêng, không hardcode `false`.
- CORS: `CORS_ORIGINS` env-driven. `NODE_ENV=production` thiếu whitelist thì fail-loud hoặc reject all; không fallback `*` trong production.
- Session cookie: `secure: nodeEnv === 'production'`, `sameSite: 'lax'`, sửa `maxage` thành `maxAge` nếu giữ field.
- Nếu production secure cookie sau reverse proxy, set `app.set('trust proxy', 1)` trước session middleware.
- Session store schema: nếu `dbConfig.schema` tồn tại, dùng top-level `schemaName: dbConfig.schema`; không đặt schema trong `conObject`.
- `config/env.js` fail-loud khi `NODE_ENV=production` mà thiếu `EXPRESS`.

**Acceptance:**

- `bin/check-config` generate config đúng với env giả gồm `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.
- Test hoặc subprocess smoke chứng minh production thiếu `EXPRESS` không start mà không cần mở DB connection thật.
- Test hoặc code-level assertion chứng minh production CORS không trả wildcard khi `CORS_ORIGINS` được set.
- Test hoặc direct inspection chứng minh session store nhận top-level `schemaName` đúng khi schema được cấu hình.
- `npm run build` pass.
- `npm test` pass hoặc mọi fail phải được chứng minh pre-existing và không liên quan. Không merge nếu session/auth tests mới fail.

---

### ISSUE B - Tenant bootstrap DRY and slug race hardening `[High-risk]`

**Gồm:** V1, V6, V10

**Mục tiêu:** Một nguồn duy nhất tạo tenant shell; duplicate slug/name race trả 409 có kiểm soát; default tenant bootstrap idempotent.

**Files dự kiến:**

- `libs/bootstrap.js`
- `routes/api_user.js`
- tests liên quan signup/login/create tenant

**Implementation notes:**

- Extract `seedTenantBase(user, { name, slug, isDefault }, transaction)` trong `libs/bootstrap.js`.
- Trước khi sửa, GitNexus context hiện tại cho `bootstrapTenantMember` cho thấy direct caller là `routes/api_user.js`; vẫn chạy `gitnexus_impact` lại trong issue vì index/worktree có thể đổi.
- `bootstrapTenantMember` giữ idempotency guard cho `{ userId, isDefault:true }`, sau đó gọi `seedTenantBase`.
- `createOwnedTenant` gọi `seedTenantBase({ isDefault:false })`, không copy `DEFAULT_COMPANY_CLASSES` logic.
- Pre-check duplicate giữ cho UX, nhưng correctness dựa trên DB unique catch.
- Bắt `SequelizeUniqueConstraintError` hoặc Postgres unique violation và map về 409/message Nhật ổn định.
- `slugFromName` thêm random 4-6 char vào suffix, vẫn giữ base deterministic.

**Acceptance:**

- Default tenant và additional tenant đều tạo `TenantMember(owner)`, 8 `CompanyClass`, 1 `Company` tên `本社`.
- Gọi `bootstrapTenantMember` 2 lần trong cùng user không tạo duplicate tenant/member/company classes.
- Hai create-tenant requests cùng slug/name: 1 thành công, 1 trả 409, không 500.
- Login path user không có membership vẫn bootstrap tenant và set `currentTenantId`.
- `npm test` pass hoặc fail được chứng minh pre-existing, không liên quan auth/tenant bootstrap.

---

### ISSUE C - Tenant and membership status integrity `[High-risk]`

**Gồm:** V5

**Mục tiêu:** `status` chỉ nhận `active|inactive` ở model và DB.

**Files dự kiến:**

- `models/tenant.js`
- `models/tenantmember.js`
- migration mới `YYYYMMDDHHMMSS-add-tenant-status-check-constraints.cjs`
- tests model/migration liên quan

**Implementation notes:**

- Thêm `validate: { isIn: [['active', 'inactive']] }` cho cả hai model.
- Migration preflight query thống kê giá trị status lạ. Nếu có dữ liệu lạ ở dev/test, normalize có chủ đích hoặc fail migration với message rõ, không silently map production data nếu chưa được duyệt.
- Add CHECK constraints:
  - `tenants_status_chk CHECK (status IN ('active','inactive'))`
  - `tenantmembers_status_chk CHECK (status IN ('active','inactive'))`
- `down` drop đúng constraint names.

**Acceptance:**

- Model validation reject `status='bogus'`.
- DB insert/update raw `status='bogus'` bị CHECK reject.
- Migration up/down chạy sạch trên test/dev DB.
- `npm test` pass hoặc fail được chứng minh không liên quan.

---

### ISSUE D - Tenant mapping policy and ORM associations `[High-risk]`

**Gồm:** V8

**Mục tiêu:** Chốt và enforce policy cho tenant-scoped model mapping. Không để plan chỉ ghi nhận missing `belongsTo(Tenant)` rồi bỏ qua.

**Decision mặc định:** Bổ sung `belongsTo(models.Tenant, { foreignKey:'tenantId', as:'tenant' })` cho tenant-scoped models nếu không tạo alias conflict. Manual scoping vẫn là authorization boundary chính ở routes/services; ORM association dùng cho include/introspection và tests.

**Files dự kiến:**

- Tenant-scoped model files trong `models/`
- tests mapping/association hoặc script verify model metadata
- docs/architecture note nếu cần

**Implementation notes:**

- Không thay route scoping trong issue này. Tránh refactor 300+ `where:{tenantId}` chỗ trong cùng PR.
- Thêm association nhỏ, nhất quán, không đổi response shape.
- Bắt đầu từ inventory đã scan: 33 model files có `tenantId allowNull:false` nhưng chưa có tenant association; `Translation` là nullable/system-scope và phải nằm ngoài guard mặc định hoặc có decision riêng.
- Nếu model nào không nên associate Tenant, ghi rõ exception trong docs/test.
- Thêm test/script duyệt model registry: mọi model có `tenantId allowNull:false` phải có tenant association hoặc nằm trong allowlist có lý do.

**Acceptance:**

- Association guard test pass: tenant-scoped models có tenant association hoặc documented allowlist.
- Existing tenant isolation tests vẫn pass.
- Không có route nào bị bỏ `where:{tenantId}` trong issue này.
- `npm test` pass hoặc fail được chứng minh không liên quan.

---

### ISSUE E - Mapping robustness, translation invariant, and debug cleanup `[Normal]`

**Gồm:** V7, V9, V11

**Mục tiêu:** Cleanup có phạm vi hẹp, không đổi tenant auth behavior.

**Files dự kiến:**

- `models/index.js`
- `models/translation.js`
- `libs/bilingual-helper.js`
- `app.js`
- tests liên quan bilingual/helper

**Implementation notes:**

- `models/index.js`: đọc config bằng `new URL('../config/config.json', import.meta.url)` như `bin/check-db.js`, không phụ thuộc cwd.
- Translation decision cho epic này: giữ **system-only translations** trong production lookup vì `enrichBilingual` hiện filter `tenantId:null` và tenant override chưa có caller/UI.
- Làm code nhất quán theo decision:
  - hoặc sửa comment/API `Translation.fetchBatch` để không hứa tenant override/fallback;
  - hoặc thêm test chứng minh `fetchBatch` là dead/utility không dùng cho tenant override hiện tại.
- Không add "system XOR tenant" DB constraint trong issue này nếu chưa implement tenant override semantics.
- `app.js`: bỏ/gate debug logs production (`current`, `command`; cleanup nearby noisy logs nếu cùng scope và test không đổi behavior).

**Acceptance:**

- Import models từ subdirectory vẫn đọc đúng config.
- Bilingual helper tests chứng minh lookup vẫn system-only (`tenantId:null`) và không regress existing bilingual display.
- Không có console debug route logs mới trong production path được chạm.
- `npm run build` và `npm test` pass hoặc fail được chứng minh không liên quan.

---

### ISSUE F - Init 2-phase proof, test helper, and docs `[Normal]`

**Gồm:** V12 và documentation/proof cho false positive bootstrap master data

**Mục tiêu:** Biến tenant init 2 pha thành documented contract và giảm test setup drift.

**Files dự kiến:**

- `test/helpers/createTestTenant.mjs` hoặc helper hiện có nếu repo đã có pattern tương đương
- refactor tối thiểu 2-3 simulation/setup tests dùng helper
- `docs/ARCHITECTURE.md`
- `README.md` hoặc docs setup phù hợp
- optional `package.json` script `setup:config` nếu chọn route script

**Implementation notes:**

- Document rõ: bootstrap shell không tạo FiscalYear/chart/menu; setup wizard mới tạo tenant accounting baseline.
- Add helper tạo tenant test theo contract rõ: shell-only hoặc setup-complete, không lẫn hai trạng thái.
- Nếu thêm `npm run setup:config`, script chỉ gọi `node ./bin/check-config`; không đổi `npm start` production behavior trong issue này trừ khi có acceptance riêng.

**Acceptance:**

- Smoke hoặc integration proof: user/tenant mới chưa setup được redirect `/setup`.
- `POST /api/setup` tạo FiscalYear, Accounts, AccountRemainings, SubAccounts/SubAccountRemainings, Menus và set session term.
- Additional tenant mới cũng đi qua setup flow riêng, không dùng nhầm data tenant khác.
- Ít nhất 2 tests dùng helper mới, và helper docs/comment phân biệt shell-only vs setup-complete.
- Docs cập nhật đúng với code.

---

## 5. Dependency và thứ tự thực thi

```text
ISSUE A - connection/session security        độc lập, high-risk
ISSUE B - bootstrap DRY + slug race          nên làm pilot
ISSUE C - status CHECK constraints           độc lập sau khi DB test path rõ
ISSUE D - tenant ORM association policy      sau B hoặc song song nếu branch nhỏ
ISSUE E - mapping/translation/debug cleanup  sau D decision hoặc độc lập nếu giữ system-only
ISSUE F - init proof/docs/test helper         sau B, cuối epic để reflect final contract
```

**Thứ tự khuyến nghị:** B -> A -> C -> D -> E -> F.

Lý do: B gỡ duplication lớn nhất và tạo nền cho proof init; A xử lý security runtime; C khóa invariant DB; D khép mapping policy; E dọn robustness/translation theo decision; F chốt docs và helper sau khi behavior đã ổn.

---

## 6. Workflow mỗi issue

1. `gh issue create` theo template trong `AGENTS.md`.
2. `scripts/bin/harness-cli.exe intake --type "change request" --summary "..." --lane high-risk|normal`.
3. Với high-risk: tạo story folder từ `docs/templates/high-risk-story/` và điền `execplan.md`, `overview.md`, `design.md`, `validation.md`.
4. Với normal: tạo/update story từ `docs/templates/story.md` nếu issue có code/product behavior; tiny/docs-only không cần story file nếu chỉ là planning artifact.
5. Tạo hoặc checkout `epic/db-tenant-hardening` từ `main`, push epic branch nếu chưa có.
6. Branch sub-issue từ epic: `feature/<issue#>-<desc>`.
7. Trước khi sửa function/class/method: chạy `gitnexus_impact({ target, direction:'upstream', repo:'fin-acc' })` và ghi blast radius vào issue/story.
8. Implement theo issue scope, không gom unrelated cleanup.
9. Chạy validation trong issue acceptance. Tối thiểu: `npm run build`, `npm test`; thêm targeted tests/smoke theo issue.
10. Chạy `gitnexus_detect_changes(scope:'all', repo:'fin-acc')` trước commit.
11. Post Test Report lên GitHub issue và record harness story update/trace.
12. Stage từng file cụ thể, không dùng `git add -A` hoặc `git add .`.
13. PR sub-issue vào `epic/db-tenant-hardening`, merge vào epic khi checks/proof đủ.
14. Epic final PR vào `main` chỉ sau khi user approve.

---

## 7. Quyết định mặc định, không còn blocker trước khi tạo issue

Các lựa chọn dưới đây là default để plan có thể tiến hành ngay. Chỉ đổi nếu user/chủ dự án yêu cầu trước khi issue tương ứng bắt đầu.

| Chủ đề | Default triển khai |
|---|---|
| SSL production | Strict: `rejectUnauthorized:true`. Self-signed/staging dùng env override explicit, không hardcode insecure. |
| CORS | Env-driven `CORS_ORIGINS`; production thiếu whitelist thì fail-loud hoặc reject, không wildcard. |
| Pilot | Bắt đầu Issue B để gỡ duplicate tenant bootstrap trước. |
| Slug race | Giữ pre-check cho UX, thêm DB unique error mapping cho correctness. |
| Translation | System-only trong epic này; tenant override/fallback là future feature riêng nếu cần. |
| Tenant mapping | Thêm association/guard test, không refactor route manual scoping trong cùng issue. |
| Local config | Thêm docs và ưu tiên `npm run setup:config` nếu không làm phức tạp startup. |

---

## 8. Ready checklist

- Audit false positives đã được sửa bằng bằng chứng hiện tại, không còn claim `git log` sai.
- Issue A dùng đúng `connect-pg-simple` option `schemaName`.
- High-risk lanes đã khớp Harness hard gates cho auth/session/tenant/migration/security.
- DB mapping scope không còn bỏ lửng missing `belongsTo(Tenant)`.
- Seeding section phân biệt legacy migration seeds, translation seeds, và fresh tenant setup wizard.
- Translation scope đã có default quyết định system-only cho production lookup; tenant override/fallback bị tách khỏi epic này trừ khi issue riêng được tạo.
- Current scripts đã khớp acceptance wording: `npm run build`, `npm test`, và optional `npm run test:unit`, `npm run test:e2e`, `npm run test:smoke` nếu issue cần targeted proof; không có `lint` script.
- Không còn câu hỏi mở bắt buộc trước khi tạo epic/issues.
