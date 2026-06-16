'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Preflight: enumerate existing status values in both tables.
    // If any value other than 'active' or 'inactive' exists, fail loudly
    // so the operator can review before applying the constraint.
    const [tenantRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "status" FROM "Tenants";`
    );
    const tenantStatuses = tenantRows.map(r => r.status);
    const invalidTenant = tenantStatuses.filter(s => !['active', 'inactive'].includes(s));
    if (invalidTenant.length > 0) {
      throw new Error(
        `Migration aborted: Tenants table contains unexpected status values: ${invalidTenant.join(', ')}. ` +
        `Normalize them to 'active' or 'inactive' before running this migration.`
      );
    }

    const [memberRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "status" FROM "TenantMembers";`
    );
    const memberStatuses = memberRows.map(r => r.status);
    const invalidMember = memberStatuses.filter(s => !['active', 'inactive'].includes(s));
    if (invalidMember.length > 0) {
      throw new Error(
        `Migration aborted: TenantMembers table contains unexpected status values: ${invalidMember.join(', ')}. ` +
        `Normalize them to 'active' or 'inactive' before running this migration.`
      );
    }

    // Add CHECK constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tenants"
        ADD CONSTRAINT "tenants_status_chk"
        CHECK (status IN ('active', 'inactive'));
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "TenantMembers"
        ADD CONSTRAINT "tenantmembers_status_chk"
        CHECK (status IN ('active', 'inactive'));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE "TenantMembers" DROP CONSTRAINT IF EXISTS "tenantmembers_status_chk";`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Tenants" DROP CONSTRAINT IF EXISTS "tenants_status_chk";`
    );
  }
};
