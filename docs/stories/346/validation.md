# Validation

## Proof Strategy

1. Migration & Model schema validation:
   - All 3 tables created cleanly.
   - `test/integration/tenant-association-guard.test.mjs` passes with 40 compliant models.
2. API integration tests:
   - Definition CRUD & schema validation.
   - Entry CRUD, required field checks, type enforcement.
   - Timeline log and activity comment records.
   - Export CSV.
3. Frontend & Browser E2E:
   - Visual schema builder creates fields.
   - Data grid renders columns dynamically.
   - Create entry, view detail, add timeline note.

## Test Plan

| Layer | Cases | Status |
| --- | --- | --- |
| Model Association Guard | 40 compliant tenant-scoped models | Tested |
| API Suite | CRUD Definition, Entry, Timeline, Export | Tested |
| Test Matrix | Mocha full run (`npm test`) | Tested |
| Browser E2E | No-code Form Builder -> Entry -> Timeline | Tested |
