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
      'Companies',
      'CompanyClasses',
      'Members',
      'Items',
      'ItemClasses',
      'TransactionDocuments',
      'TransactionKinds',
      'Vouchers',
      'VoucherClasses',
      'Documents',
      'Tasks',
      'Menus',
      'TaxRules',
      'Projects',
      'Labels',
    ];

    for (const table of tables) {
      // Check if column already exists
      const [columns] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = :table AND column_name = 'tenantId';`,
        { replacements: { table } }
      );
      
      if (columns.length === 0) {
        await queryInterface.addColumn(table, 'tenantId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Tenants', field: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        });
      }
      
      // Check if index already exists - check for exact index name pattern used by Sequelize
      const tableLowerSnake = table.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      const expectedIndexName = `${tableLowerSnake}_tenant_id`;
      const [indexes] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = :table AND indexname = :indexName;`,
        { replacements: { table, indexName: expectedIndexName } }
      );
      
      if (indexes.length === 0) {
        await queryInterface.addIndex(table, ['tenantId']);
      }

      if (legacyTenantId) {
        await queryInterface.sequelize.query(
          `UPDATE "${table}" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
          { replacements: { tenantId: legacyTenantId } }
        );
      }
    }

    // Remove old global unique on Label.name and Project.code before re-adding as tenant-scoped
    // (Only drop if they exist — ignore errors)
    try {
      await queryInterface.removeConstraint('Labels', 'Labels_name_key');
    } catch (_) {}
    try {
      await queryInterface.removeConstraint('Projects', 'Projects_code_key');
    } catch (_) {}

    await queryInterface.addConstraint('Labels', {
      fields: ['tenantId', 'name'],
      type: 'unique',
      name: 'Labels_tenantId_name_key'
    });
    await queryInterface.addConstraint('Projects', {
      fields: ['tenantId', 'code'],
      type: 'unique',
      name: 'Projects_tenantId_code_key'
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeConstraint('Labels', 'Labels_tenantId_name_key');
    } catch (_) {}
    try {
      await queryInterface.removeConstraint('Projects', 'Projects_tenantId_code_key');
    } catch (_) {}

    const tables = [
      'Labels',
      'Projects',
      'TaxRules',
      'Menus',
      'Tasks',
      'Documents',
      'VoucherClasses',
      'Vouchers',
      'TransactionKinds',
      'TransactionDocuments',
      'ItemClasses',
      'Items',
      'Members',
      'CompanyClasses',
      'Companies',
    ];

    for (const table of tables) {
      await queryInterface.removeIndex(table, ['tenantId']);
      await queryInterface.removeColumn(table, 'tenantId');
    }
  },
};
