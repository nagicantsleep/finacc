# Design

## Migration Architecture

### 1. Baseline Schema Migration (`<timestamp>-freshdb-baseline-schema.cjs`)
- Includes fail-fast guard at the top of `up()` checking that table count in schema `public` (excluding `SequelizeMeta`) is strictly 0.
- Wrapped in an explicit `queryInterface.sequelize.transaction(async (t) => { ... })`.
- Executes sequential DDL statements: ENUM types -> BASE TABLES -> Primary Keys & Unique constraints -> CHECK constraints -> Foreign Keys -> Partial Unique & regular indexes.
- `down()` drops all tables safely in reverse dependency order or `DROP TABLE IF EXISTS "..." CASCADE;`.

### 2. System Translations Seed Migration (`<timestamp>-seed-system-translations.cjs`)
- Contains 546 system translations (`tenantId: null`).
- Uses idempotent upsert:
  `INSERT INTO "Translations" (...) VALUES (...) ON CONFLICT ("tableName", "recordKey", "field", "language") WHERE "tenantId" IS NULL DO NOTHING;`
- `down()` removes specifically the 546 system translation tuples.
