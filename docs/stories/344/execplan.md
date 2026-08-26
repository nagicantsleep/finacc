# Exec Plan

## Goal

Squash 46 Sequelize migration files down to 2 fresh-DB migration files (baseline schema + system translations) with verified schema parity and automated proof.

## Scope

In scope:
- Schema extraction and canonical baseline generator script (`scripts/generate-freshdb-baseline.cjs`).
- System translations seed generator (`scripts/generate-system-translations-seed.cjs`).
- Generation of 2 new migration files.
- Safe removal of 46 legacy migration files.
- Schema parity validation (DDL diff & column snapshot diff).
- Verification of test suite, seed idempotency, fail-fast guard, and tenant setup flow.

Out of scope:
- In-place schema migration on existing databases with legacy data.

## Risk Classification

Risk flags:
- High-risk maintenance request.
- Data model changes across all 41 tables.

Hard gates:
- Schema parity diff must be empty against the oracle.
- Verified translation count must be exactly 546.
- 100% of tests must pass.

## Work Phases

1. Phase 0: Schema oracle extraction and baseline capture (Completed: 500 columns, 546 translations, 41 tables).
2. Phase 1: Issue creation (#344), Harness intake/story setup, branch creation.
3. Phase 2: Implementation of generator scripts, creation of 2 migration files, removal of 46 legacy migrations.
4. Phase 3: Validation on fresh scratch DB (schema diff, column diff, seed idempotency, fail-fast test, full test suite).
5. Phase 4: Harness trace and PR creation.
