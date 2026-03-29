'use strict';

const LEGACY_TENANT_SLUG = 'default';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [tenants] = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants" WHERE slug = :slug LIMIT 1;',
      { replacements: { slug: LEGACY_TENANT_SLUG } }
    );
    const legacyTenantId = tenants[0]?.id ?? null;

    const tables = [
      'FiscalYears',
      'AccountClasses',
      'Accounts',
      'SubAccounts',
      'AccountRemainings',
      'SubAccountRemainings',
      'CrossSlips',
      'MonthlyLogs',
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'tenantId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tenants', field: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
      await queryInterface.addIndex(table, ['tenantId']);

      if (legacyTenantId) {
        await queryInterface.sequelize.query(
          `UPDATE "${table}" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
          { replacements: { tenantId: legacyTenantId } }
        );
      }
    }
  },

  async down(queryInterface) {
    const tables = [
      'MonthlyLogs',
      'CrossSlips',
      'SubAccountRemainings',
      'AccountRemainings',
      'SubAccounts',
      'Accounts',
      'AccountClasses',
      'FiscalYears',
    ];

    for (const table of tables) {
      await queryInterface.removeIndex(table, ['tenantId']);
      await queryInterface.removeColumn(table, 'tenantId');
    }
  },
};
