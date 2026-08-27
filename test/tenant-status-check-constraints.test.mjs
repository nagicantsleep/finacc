/**
 * Issue #334: Tenant and TenantMember status CHECK constraint tests.
 *
 * Validates model validation and DB CHECK constraints on the status column.
 */
import { expect } from 'chai';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Sequelize } from 'sequelize';

const projectRoot = resolve(import.meta.dirname, '..');

// ---------------------------------------------------------------------------
// Helper: get a Sequelize instance connected to the test DB
// ---------------------------------------------------------------------------
import dotenv from 'dotenv';
dotenv.config();

function getTestSequelize() {
  return new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_TEST_NAME || 'hieronymus_test',
    username: process.env.DB_USER || 'hieronymus',
    password: process.env.DB_PASSWORD || 'hieronymus',
    logging: false
  });
}

// ===========================================================================
// Test suite
// ===========================================================================
describe('Issue #334 — Tenant/TenantMember status CHECK constraints', function () {
  this.timeout(15000);

  let sequelize;
  let testTenantId;
  let testMemberId;

  before(async () => {
    sequelize = getTestSequelize();
    await sequelize.authenticate();

    // Create a deterministic test tenant and member for the test suite
    const [tRes] = await sequelize.query(`
      INSERT INTO "Tenants" ("slug", "name", "status", "createdAt", "updatedAt")
      VALUES ('test-check-suite-tenant', 'Test Check Tenant', 'active', NOW(), NOW())
      RETURNING id;
    `);
    testTenantId = tRes[0].id;

    const [mRes] = await sequelize.query(`
      INSERT INTO "TenantMembers" ("tenantId", "status", "createdAt", "updatedAt")
      VALUES (${testTenantId}, 'active', NOW(), NOW())
      RETURNING id;
    `);
    testMemberId = mRes[0].id;
  });

  after(async () => {
    if (sequelize) {
      if (testTenantId) {
        await sequelize.query(`DELETE FROM "TenantMembers" WHERE "tenantId" = ${testTenantId};`);
        await sequelize.query(`DELETE FROM "Tenants" WHERE "id" = ${testTenantId};`);
      }
      await sequelize.close();
    }
  });

  // -----------------------------------------------------------------------
  // 1. Model validation rejects invalid status
  // -----------------------------------------------------------------------
  describe('Model validation', () => {
    it('Tenant model rejects status="bogus"', async () => {
      try {
        await sequelize.query(
          `UPDATE "Tenants" SET "status" = :status WHERE "id" = :id`,
          { replacements: { status: 'bogus', id: testTenantId } }
        );
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('TenantMember model rejects status="bogus"', async () => {
      try {
        await sequelize.query(
          `UPDATE "TenantMembers" SET "status" = :status WHERE "id" = :id`,
          { replacements: { status: 'bogus', id: testMemberId } }
        );
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenantmembers_status_chk');
      }
    });
  });

  // -----------------------------------------------------------------------
  // 2. DB CHECK constraints reject invalid values
  // -----------------------------------------------------------------------
  describe('DB CHECK constraints', () => {
    it('Tenants CHECK constraint exists', async () => {
      const [results] = await sequelize.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = '"Tenants"'::regclass
          AND conname = 'tenants_status_chk';
      `);
      expect(results).to.have.length(1);
      expect(results[0].contype).to.equal('c'); // c = check constraint
    });

    it('TenantMembers CHECK constraint exists', async () => {
      const [results] = await sequelize.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = '"TenantMembers"'::regclass
          AND conname = 'tenantmembers_status_chk';
      `);
      expect(results).to.have.length(1);
      expect(results[0].contype).to.equal('c');
    });

    it('Raw INSERT with status="bogus" rejected on Tenants', async () => {
      try {
        await sequelize.query(`
          INSERT INTO "Tenants" ("slug", "name", "status", "createdAt", "updatedAt")
          VALUES ('test-bogus', 'Test Bogus', 'bogus', NOW(), NOW());
        `);
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('Raw INSERT with status="bogus" rejected on TenantMembers', async () => {
      try {
        await sequelize.query(`
          INSERT INTO "TenantMembers" ("tenantId", "status", "createdAt", "updatedAt")
          VALUES (${testTenantId}, 'bogus', NOW(), NOW());
        `);
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenantmembers_status_chk');
      }
    });

    it('Raw UPDATE with status="bogus" rejected on Tenants', async () => {
      try {
        await sequelize.query(
          `UPDATE "Tenants" SET "status" = 'bogus' WHERE "id" = :id`,
          { replacements: { id: testTenantId } }
        );
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('Raw UPDATE with status="bogus" rejected on TenantMembers', async () => {
      try {
        await sequelize.query(
          `UPDATE "TenantMembers" SET "status" = 'bogus' WHERE "id" = :id`,
          { replacements: { id: testMemberId } }
        );
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenantmembers_status_chk');
      }
    });

    it('Raw INSERT with status="active" succeeds on Tenants', async () => {
      const [results] = await sequelize.query(`
        INSERT INTO "Tenants" ("slug", "name", "status", "createdAt", "updatedAt")
        VALUES ('test-valid-active', 'Test Valid Active', 'active', NOW(), NOW())
        RETURNING id;
      `);
      expect(results).to.have.length(1);
      await sequelize.query(
        `DELETE FROM "Tenants" WHERE "slug" = 'test-valid-active';`
      );
    });

    it('Raw INSERT with status="inactive" succeeds on Tenants', async () => {
      const [results] = await sequelize.query(`
        INSERT INTO "Tenants" ("slug", "name", "status", "createdAt", "updatedAt")
        VALUES ('test-valid-inactive', 'Test Valid Inactive', 'inactive', NOW(), NOW())
        RETURNING id;
      `);
      expect(results).to.have.length(1);
      await sequelize.query(
        `DELETE FROM "Tenants" WHERE "slug" = 'test-valid-inactive';`
      );
    });
  });

  // -----------------------------------------------------------------------
  // 3. Migration source code verification
  // -----------------------------------------------------------------------
  describe('Migration source', () => {
    it('baseline migration file exists', () => {
      const migrationPath = resolve(
        projectRoot,
        'migrations/20260826000000-freshdb-baseline-schema.cjs'
      );
      expect(existsSync(migrationPath)).to.be.true;
    });

    it('baseline migration includes tenants_status_chk constraint', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260826000000-freshdb-baseline-schema.cjs'),
        'utf8'
      );
      expect(src).to.include('tenants_status_chk');
    });

    it('baseline migration includes tenantmembers_status_chk constraint', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260826000000-freshdb-baseline-schema.cjs'),
        'utf8'
      );
      expect(src).to.include('tenantmembers_status_chk');
    });

    it('baseline migration down drops correct constraints/tables', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260826000000-freshdb-baseline-schema.cjs'),
        'utf8'
      );
      expect(src).to.include('DROP TABLE IF EXISTS "TenantMembers" CASCADE');
      expect(src).to.include('DROP TABLE IF EXISTS "Tenants" CASCADE');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Model source code verification
  // -----------------------------------------------------------------------
  describe('Model source verification', () => {
    it('Tenant model has validate.isIn for status', () => {
      const src = readFileSync(resolve(projectRoot, 'models/tenant.js'), 'utf8');
      expect(src).to.include("isIn: [['active', 'inactive']]");
    });

    it('TenantMember model has validate.isIn for status', () => {
      const src = readFileSync(resolve(projectRoot, 'models/tenantmember.js'), 'utf8');
      expect(src).to.include("isIn: [['active', 'inactive']]");
    });
  });
});
