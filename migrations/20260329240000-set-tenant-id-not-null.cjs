'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tables that got tenantId via accounting slice migration
    const accountingSliceTables = [
      'FiscalYears',
      'AccountClasses',
      'Accounts',
      'SubAccounts',
      'AccountRemainings',
      'SubAccountRemainings',
      'CrossSlips',
      'MonthlyLogs',
    ];

    // Tables that got tenantId via Members + UserTenants migration
    const memberTables = ['Members'];

    // Tables that got tenantId via child tables migration (#15)
    const childTables = [
      'TransactionDetails',
      'TaskDetails',
      'CrossSlipDetails',
      'VoucherFiles',
      'DocumentFiles',
      'ProjectLabels',
      'LabelAccounts',
    ];

    // Stickies and StickyStatuses were created with tenantId in #15 migration
    // so no need to SET NOT NULL separately — they already created nullable; handle here.
    const stickyTables = ['Stickies', 'StickyStatuses'];

    const allTables = [
      ...accountingSliceTables,
      ...memberTables,
      ...childTables,
      ...stickyTables,
    ];

    for (const table of allTables) {
      // Set NOT NULL using raw SQL (changeColumn also works but this is safer for PG)
      await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenantId" SET NOT NULL;`
      );
    }
  },

  async down(queryInterface) {
    const allTables = [
      'StickyStatuses',
      'Stickies',
      'LabelAccounts',
      'ProjectLabels',
      'DocumentFiles',
      'VoucherFiles',
      'CrossSlipDetails',
      'TaskDetails',
      'TransactionDetails',
      'Members',
      'MonthlyLogs',
      'CrossSlips',
      'SubAccountRemainings',
      'AccountRemainings',
      'SubAccounts',
      'Accounts',
      'AccountClasses',
      'FiscalYears',
    ];

    for (const table of allTables) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenantId" DROP NOT NULL;`
      );
    }
  },
};
