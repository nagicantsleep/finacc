'use strict';

/**
 * E2.13 — add a query index on AuditEvents for (entityType, entityId).
 *
 * AuditEvents.payload is JSONB and carries `entityType` / `entityId` for
 * simulation events (and closing, etc). To query a scenario's full history
 * by (entityType, entityId) efficiently, add a btree index on the extracted
 * JSONB text values. Idempotent: checks pg_indexes first.
 */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'AuditEvents'
         AND indexname = 'audit_events_entity_idx'
       LIMIT 1;`
    );
    if (rows.length === 0) {
      await queryInterface.sequelize.query(
        `CREATE INDEX "audit_events_entity_idx"
         ON "AuditEvents" (
           (payload->>'entityType'),
           (payload->>'entityId')
         );`
      );
    }
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "audit_events_entity_idx";`
    );
  },
};
