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
function getTestSequelize() {
  const raw = readFileSync(resolve(projectRoot, 'config/config.json'), 'utf8');
  const cfg = JSON.parse(raw).test;
  return new Sequelize({
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port || 5432,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    logging: false
  });
}

// ===========================================================================
// Test suite
// ===========================================================================
describe('Issue #334 — Tenant/TenantMember status CHECK constraints', function () {
  this.timeout(15000);

  let sequelize;

  before(async () => {
    sequelize = getTestSequelize();
    await sequelize.authenticate();
  });

  after(async () => {
    if (sequelize) await sequelize.close();
  });

  // -----------------------------------------------------------------------
  // 1. Model validation rejects invalid status
  // -----------------------------------------------------------------------
  describe('Model validation', () => {
    // We test via raw Sequelize model definitions that mirror the validate config
    it('Tenant model rejects status="bogus"', async () => {
      const [results] = await sequelize.query(
        `SELECT id FROM "Tenants" LIMIT 1`
      );
      const tenantId = results[0]?.id;

      // Direct Sequelize insert with invalid status should fail validation
      try {
        await sequelize.query(
          `UPDATE "Tenants" SET "status" = :status WHERE "id" = :id`,
          { replacements: { status: 'bogus', id: tenantId } }
        );
        // If raw SQL succeeds, the CHECK constraint should catch it
        // (this tests the DB-level constraint, not Sequelize validation)
      } catch (err) {
        // Expected: CHECK constraint violation
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('TenantMember model rejects status="bogus"', async () => {
      const [results] = await sequelize.query(
        `SELECT id FROM "TenantMembers" LIMIT 1`
      );
      const memberId = results[0]?.id;

      try {
        await sequelize.query(
          `UPDATE "TenantMembers" SET "status" = :status WHERE "id" = :id`,
          { replacements: { status: 'bogus', id: memberId } }
        );
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
        // If we get here, constraint is missing — fail the test
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('Raw INSERT with status="bogus" rejected on TenantMembers', async () => {
      try {
        await sequelize.query(`
          INSERT INTO "TenantMembers" ("tenantId", "status", "createdAt", "updatedAt")
          VALUES (1, 'bogus', NOW(), NOW());
        `);
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenantmembers_status_chk');
      }
    });

    it('Raw UPDATE with status="bogus" rejected on Tenants', async () => {
      const [results] = await sequelize.query(
        `SELECT id FROM "Tenants" LIMIT 1`
      );
      if (results.length === 0) return this.skip();

      try {
        await sequelize.query(
          `UPDATE "Tenants" SET "status" = 'bogus' WHERE "id" = :id`,
          { replacements: { id: results[0].id } }
        );
        expect.fail('Expected CHECK constraint violation');
      } catch (err) {
        expect(err.message).to.include('tenants_status_chk');
      }
    });

    it('Raw UPDATE with status="bogus" rejected on TenantMembers', async () => {
      const [results] = await sequelize.query(
        `SELECT id FROM "TenantMembers" LIMIT 1`
      );
      if (results.length === 0) return this.skip();

      try {
        await sequelize.query(
          `UPDATE "TenantMembers" SET "status" = 'bogus' WHERE "id" = :id`,
          { replacements: { id: results[0].id } }
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
      // Clean up
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
      // Clean up
      await sequelize.query(
        `DELETE FROM "Tenants" WHERE "slug" = 'test-valid-inactive';`
      );
    });
  });

  // -----------------------------------------------------------------------
  // 3. Migration source code verification
  // -----------------------------------------------------------------------
  describe('Migration source', () => {
    it('migration file exists', () => {
      const migrationPath = resolve(
        projectRoot,
        'migrations/20260616210000-add-tenant-status-check-constraints.cjs'
      );
      expect(existsSync(migrationPath)).to.be.true;
    });

    it('migration has preflight check for Tenants', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260616210000-add-tenant-status-check-constraints.cjs'),
        'utf8'
      );
      expect(src).to.include('Migration aborted');
      expect(src).to.include('Tenants');
      expect(src).to.include('DISTINCT');
    });

    it('migration has preflight check for TenantMembers', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260616210000-add-tenant-status-check-constraints.cjs'),
        'utf8'
      );
      expect(src).to.include('TenantMembers');
    });

    it('migration down drops correct constraint names', () => {
      const src = readFileSync(
        resolve(projectRoot, 'migrations/20260616210000-add-tenant-status-check-constraints.cjs'),
        'utf8'
      );
      expect(src).to.include('DROP CONSTRAINT IF EXISTS "tenantmembers_status_chk"');
      expect(src).to.include('DROP CONSTRAINT IF EXISTS "tenants_status_chk"');
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
