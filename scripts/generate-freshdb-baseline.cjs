/**
 * Generates the fresh DB baseline migration file from hieronymus_squash schema.
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

  // 1. Get Tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'SequelizeMeta'
    ORDER BY table_name;
  `);
  const tableNames = tablesRes.rows.map(r => r.table_name);

  // 2. Get ENUM types
  const typesRes = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `);
  const enumMap = new Map();
  for (const row of typesRes.rows) {
    if (!enumMap.has(row.typname)) enumMap.set(row.typname, []);
    enumMap.get(row.typname).push(row.enumlabel);
  }

  // 3. Get Sequences
  const seqsRes = await client.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
    ORDER BY sequence_name;
  `);
  const sequenceNames = seqsRes.rows.map(r => r.sequence_name);

  // Sequence ownership
  const seqOwnershipRes = await client.query(`
    SELECT s.relname AS seq, t.relname AS tab, a.attname AS col
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON d.refobjid = t.oid
    JOIN pg_attribute a ON d.refobjid = a.attrelid AND d.refobjsubid = a.attnum
    JOIN pg_namespace n ON n.oid = s.relnamespace
    WHERE s.relkind = 'S' AND t.relkind = 'r' AND n.nspname = 'public'
    ORDER BY s.relname;
  `);

  // 4. Get Columns
  const columnsRes = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name <> 'SequelizeMeta'
    ORDER BY table_name, ordinal_position;
  `);

  // 5. Primary Keys and Uniques
  const pksAndUniquesRes = await client.query(`
    SELECT conname, relname AS tablename, contype, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND c.contype IN ('p', 'u') AND r.relname <> 'SequelizeMeta'
    ORDER BY r.relname, conname;
  `);

  // 6. Check constraints
  const checksRes = await client.query(`
    SELECT conname, relname AS tablename, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND c.contype = 'c' AND r.relname <> 'SequelizeMeta'
    ORDER BY r.relname, conname;
  `);

  // 7. Foreign Keys
  const fksRes = await client.query(`
    SELECT conname, relname AS tablename, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND c.contype = 'f' AND r.relname <> 'SequelizeMeta'
    ORDER BY r.relname, conname;
  `);

  // 8. Indexes (including partial unique indexes)
  const indexesRes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename <> 'SequelizeMeta'
    ORDER BY tablename, indexname;
  `);

  await client.end();

  const statements = [];

  // ENUM types
  for (const [typname, values] of enumMap.entries()) {
    const valList = values.map(v => `'${v}'`).join(', ');
    statements.push(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typname}') THEN
    CREATE TYPE "${typname}" AS ENUM (${valList});
  END IF;
END $$;`);
  }

  // Sequences
  for (const seq of sequenceNames) {
    statements.push(`CREATE SEQUENCE IF NOT EXISTS "${seq}";`);
  }

  // CREATE TABLE statements
  for (const table of tableNames) {
    const cols = columnsRes.rows.filter(c => c.table_name === table);
    const colDefs = cols.map(c => {
      // Fix legacy 2024 default for memberClassId on TenantMembers
      if (c.table_name === 'TenantMembers' && c.column_name === 'memberClassId') {
        c.column_default = null;
      }

      let typeStr = '';
      if (c.data_type === 'USER-DEFINED') {
        typeStr = `"${c.udt_name}"`;
      } else if (c.data_type === 'character varying') {
        typeStr = c.character_maximum_length ? `VARCHAR(${c.character_maximum_length})` : 'VARCHAR(255)';
      } else if (c.data_type === 'ARRAY') {
        typeStr = `${c.udt_name.replace(/^_/, '')}[]`;
      } else {
        typeStr = c.data_type.toUpperCase();
      }

      let def = `"${c.column_name}" ${typeStr}`;
      if (c.column_default !== null) {
        def += ` DEFAULT ${c.column_default}`;
      }
      if (c.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      return `  ${def}`;
    });

    statements.push(`CREATE TABLE "${table}" (\n${colDefs.join(',\n')}\n);`);
  }

  // Sequence ownership
  for (const own of seqOwnershipRes.rows) {
    statements.push(`ALTER SEQUENCE "${own.seq}" OWNED BY "${own.tab}"."${own.col}";`);
  }

  // Primary Keys & Unique constraints
  for (const con of pksAndUniquesRes.rows) {
    statements.push(`ALTER TABLE "${con.tablename}" ADD CONSTRAINT "${con.conname}" ${con.def};`);
  }

  // CHECK constraints
  for (const con of checksRes.rows) {
    statements.push(`ALTER TABLE "${con.tablename}" ADD CONSTRAINT "${con.conname}" ${con.def};`);
  }

  // Foreign Keys
  for (const con of fksRes.rows) {
    statements.push(`ALTER TABLE "${con.tablename}" ADD CONSTRAINT "${con.conname}" ${con.def};`);
  }

  // Indexes (excluding those already created as constraints)
  const constraintNames = new Set(pksAndUniquesRes.rows.map(c => c.conname));
  for (const idx of indexesRes.rows) {
    if (!constraintNames.has(idx.indexname)) {
      statements.push(`${idx.indexdef};`);
    }
  }

  const dropTableList = tableNames.map(t => `  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "${t}" CASCADE;', { transaction: t });`).join('\n');
  const dropTypeList = Array.from(enumMap.keys()).map(typ => `  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "${typ}" CASCADE;', { transaction: t });`).join('\n');
  const dropSeqList = sequenceNames.map(seq => `  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "${seq}" CASCADE;', { transaction: t });`).join('\n');

  const statementsJs = JSON.stringify(statements, null, 2);

  const fileContent = `'use strict';

/**
 * Fresh DB Baseline Schema Migration
 * Consolidated from 46 legacy migrations for greenfield databases.
 */
const STATEMENTS = ${statementsJs};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fail-fast guard: ensure DB has zero product tables
    const [existingTables] = await queryInterface.sequelize.query(\`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE' 
        AND table_name <> 'SequelizeMeta'
    \`);
    
    if (existingTables[0].count > 0) {
      throw new Error(
        'Fresh-DB-only baseline migration failed: target database is not empty (' + 
        existingTables[0].count + ' existing tables found). ' +
        'This migration requires a fresh database reset.'
      );
    }

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query('SET search_path = public;', { transaction: t });
      for (const statement of STATEMENTS) {
        await queryInterface.sequelize.query(statement, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
${dropTableList}
${dropTypeList}
${dropSeqList}
    });
  }
};
`;

  const targetPath = path.resolve(__dirname, '../migrations/20260826000000-freshdb-baseline-schema.cjs');
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`Successfully generated baseline schema migration at: ${targetPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
