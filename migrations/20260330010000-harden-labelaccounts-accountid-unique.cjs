'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fail fast if any rows still have NULL accountId (backfill in prior migration should have covered them)
    const [rows] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM "LabelAccounts" WHERE "accountId" IS NULL;`
    );
    const nullCount = parseInt(rows[0].cnt, 10);
    if (nullCount > 0) {
      throw new Error(
        `Cannot add NOT NULL constraint: ${nullCount} row(s) in LabelAccounts still have NULL accountId. ` +
        'Run the backfill from migration 20260329230000 first.'
      );
    }

    // Make accountId NOT NULL
    await queryInterface.changeColumn('LabelAccounts', 'accountId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Accounts', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add composite unique constraint to prevent duplicate label-account-tenant entries
    await queryInterface.addConstraint('LabelAccounts', {
      fields: ['labelId', 'accountId', 'tenantId'],
      type: 'unique',
      name: 'LabelAccounts_labelId_accountId_tenantId_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'LabelAccounts',
      'LabelAccounts_labelId_accountId_tenantId_unique'
    );

    await queryInterface.changeColumn('LabelAccounts', 'accountId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Accounts', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
