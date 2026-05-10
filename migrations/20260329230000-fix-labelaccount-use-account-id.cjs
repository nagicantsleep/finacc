'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add accountId column
    await queryInterface.addColumn('LabelAccounts', 'accountId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Accounts', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Backfill accountId from Accounts where accountCode + tenantId match
    await queryInterface.sequelize.query(
      `UPDATE "LabelAccounts" la
       SET "accountId" = a.id
       FROM "Accounts" a
       WHERE la."accountCode" = a."accountCode"
         AND la."tenantId" = a."tenantId"
         AND la."accountId" IS NULL;`
    );

    // Add index on accountId
    await queryInterface.addIndex('LabelAccounts', ['accountId']);

    // Drop old accountCode column
    await queryInterface.removeColumn('LabelAccounts', 'accountCode');
  },

  async down(queryInterface, Sequelize) {
    // Restore accountCode column
    await queryInterface.addColumn('LabelAccounts', 'accountCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Backfill accountCode from Accounts
    await queryInterface.sequelize.query(
      `UPDATE "LabelAccounts" la
       SET "accountCode" = a."accountCode"
       FROM "Accounts" a
       WHERE la."accountId" = a.id
         AND la."accountCode" IS NULL;`
    );

    await queryInterface.removeIndex('LabelAccounts', ['accountId']);
    await queryInterface.removeColumn('LabelAccounts', 'accountId');
  },
};
