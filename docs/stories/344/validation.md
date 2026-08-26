# Validation

## Proof Strategy

1. Greenfield migration test from zero.
2. Schema parity verification against Oracle snapshot (DDL + Columns diff).
3. Translation count verification (= 546) and seed idempotency proof.
4. Fail-fast baseline guard verification on non-empty DB.
5. Recreate test DB and run all tests (`npm test`, `npm run test:e2e`, `npm run test:smoke`).
6. Tenant lifecycle E2E verification (signup -> setup wizard -> home).

## Test Plan

| Layer | Cases | Status |
| --- | --- | --- |
| Unit & Integration | Mocha test suite | 467/467 tests |
| Schema Parity | DDL text diff & Column definition diff | Empty diff |
| Data Invariant | Translations count = 546, zero duplicates | Verified |
| Idempotency | Rerun seed migration | Verified |
| Guard | Baseline fail-fast on non-empty DB | Verified |
| E2E | 2-Phase Tenant Signup & Setup | Verified |
