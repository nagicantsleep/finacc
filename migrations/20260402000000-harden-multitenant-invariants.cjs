'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 1. Enforce at most one isDefault=true membership per user.
    //    Partial unique index: only rows where isDefault IS TRUE are constrained.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "TenantMembers_userId_isDefault_unique"
      ON "TenantMembers" ("userId")
      WHERE "isDefault" = true AND "userId" IS NOT NULL;
    `);

    // 2. Enforce one CompanyClass per name per tenant (prevents duplicate '自社').
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "CompanyClasses_tenantId_name_unique"
      ON "CompanyClasses" ("tenantId", "name");
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "CompanyClasses_tenantId_name_unique";'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "TenantMembers_userId_isDefault_unique";'
    );
  }
};
