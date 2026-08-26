/**
 * Generates the fresh DB system translations seed migration.
 */
const fs = require('fs');
const path = require('path');
const pg = require('pg');

async function main() {
  const client = new pg.Client({
    user: 'hieronymus',
    password: 'hieronymus',
    host: 'localhost',
    port: 5432,
    database: 'hieronymus_squash'
  });
  await client.connect();

  const transRes = await client.query(`
    SELECT "tableName", "recordKey", "field", "language", "value"
    FROM "Translations"
    WHERE "tenantId" IS NULL
    ORDER BY "tableName", "recordKey", "field", "language";
  `);

  await client.end();

  console.log(`Fetched ${transRes.rows.length} system translation rows.`);
  if (transRes.rows.length !== 546) {
    throw new Error(`Expected exactly 546 system translations, got ${transRes.rows.length}`);
  }

  const rowsJs = JSON.stringify(transRes.rows, null, 2);

  const fileContent = `'use strict';

/**
 * System Translations Seed Migration
 * Consolidated from 6 bilingual seed migrations.
 * Total verified system translations: 546.
 */
const SYSTEM_TRANSLATIONS = ${rowsJs};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const records = SYSTEM_TRANSLATIONS.map(row => ({
      tableName: row.tableName,
      recordKey: row.recordKey,
      field: row.field,
      language: row.language,
      value: row.value,
      tenantId: null,
      createdAt: now,
      updatedAt: now
    }));

    // Batch insert with ON CONFLICT DO NOTHING on system partial unique index
    await queryInterface.sequelize.transaction(async (t) => {
      // Chunk into batches of 100 to stay well within Postgres parameter limits
      const chunkSize = 100;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const valuePlaceholders = chunk.map((_, idx) => {
          const base = idx * 8;
          return \`($\${base + 1}, $\${base + 2}, $\${base + 3}, $\${base + 4}, $\${base + 5}, $\${base + 6}, $\${base + 7}, $\${base + 8})\`;
        }).join(',\\n');

        const params = [];
        for (const r of chunk) {
          params.push(r.tableName, r.recordKey, r.field, r.language, r.value, r.tenantId, r.createdAt, r.updatedAt);
        }

        const sql = \`
          INSERT INTO "Translations" ("tableName", "recordKey", "field", "language", "value", "tenantId", "createdAt", "updatedAt")
          VALUES \${valuePlaceholders}
          ON CONFLICT ("tableName", "recordKey", "field", "language") WHERE "tenantId" IS NULL DO NOTHING;
        \`;

        await queryInterface.sequelize.query(sql, {
          bind: params,
          transaction: t
        });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Delete specifically the system translation tuples managed by this seed
      const chunkSize = 100;
      for (let i = 0; i < SYSTEM_TRANSLATIONS.length; i += chunkSize) {
        const chunk = SYSTEM_TRANSLATIONS.slice(i, i + chunkSize);
        const conditions = chunk.map((_, idx) => {
          const base = idx * 4;
          return \`("tableName" = $\${base + 1} AND "recordKey" = $\${base + 2} AND "field" = $\${base + 3} AND "language" = $\${base + 4} AND "tenantId" IS NULL)\`;
        }).join(' OR\\n  ');

        const params = [];
        for (const r of chunk) {
          params.push(r.tableName, r.recordKey, r.field, r.language);
        }

        const sql = \`
          DELETE FROM "Translations"
          WHERE \${conditions};
        \`;

        await queryInterface.sequelize.query(sql, {
          bind: params,
          transaction: t
        });
      }
    });
  }
};
`;

  const targetPath = path.resolve(__dirname, '../migrations/20260826010000-seed-system-translations.cjs');
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`Successfully generated system translations seed migration at: ${targetPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
