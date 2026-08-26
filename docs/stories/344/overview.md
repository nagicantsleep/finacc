# Overview

## Current Behavior

- The `migrations/` directory contains 46 Sequelize migrations dating from 2022 to 2026.
- Many older migrations contain intermediate transition steps (legacy `default` tenant creation, seed of `ItemClasses`/`VoucherClasses` before tenant isolation, subsequent backfill and NOT NULL alterations).
- Translations are seeded across 6 different migration files.

## Target Behavior

- Rút gọn toàn bộ 46 migrations xuống còn đúng 2 migration files dành cho Greenfield / Fresh DB:
  1. `<timestamp>-freshdb-baseline-schema.cjs`: Baseline schema chứa toàn bộ 41 bảng, khóa chính, khóa ngoại, CHECK constraints, partial unique indexes và default values.
  2. `<timestamp>-seed-system-translations.cjs`: Seed toàn bộ 546 bản dịch hệ thống (`tenantId IS NULL`) với cơ chế `ON CONFLICT (...) WHERE "tenantId" IS NULL DO NOTHING`.
- Fail-fast nếu chạy baseline trên DB đã có dữ liệu / bảng.
- Bảo đảm 2-phase tenant lifecycle và test suite tiếp tục hoạt động hoàn hảo.

## Affected Users

- Developers, CI/CD pipelines, fresh production/staging deployments.

## Affected Product Docs

- `docs/ARCHITECTURE.md`
- `freshdb-squash-migration-plan.md`

## Non-Goals

- In-place upgrade path cho database cũ chứa data dev / legacy migration history.
- Sửa đổi logic runtime của 2-phase tenant bootstrap hay setup wizard.
