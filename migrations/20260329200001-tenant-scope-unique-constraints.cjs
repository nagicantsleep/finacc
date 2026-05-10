'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Drop old single-table unique constraints that break multi-tenancy
    await queryInterface.removeConstraint('Accounts', 'Accounts_accountCode_key');
    await queryInterface.removeConstraint('AccountRemainings', 'AccountRemainings_term_accountId_key');
    await queryInterface.removeConstraint('MonthlyLogs', 'MonthlyLogs_term_month_key');
    await queryInterface.removeConstraint('CrossSlips', 'CrossSlips_year_month_no_key');

    // Re-add as tenant-scoped unique constraints
    await queryInterface.addConstraint('Accounts', {
      fields: ['tenantId', 'accountCode'],
      type: 'unique',
      name: 'Accounts_tenantId_accountCode_key'
    });
    await queryInterface.addConstraint('AccountRemainings', {
      fields: ['tenantId', 'term', 'accountId'],
      type: 'unique',
      name: 'AccountRemainings_tenantId_term_accountId_key'
    });
    await queryInterface.addConstraint('MonthlyLogs', {
      fields: ['tenantId', 'term', 'month'],
      type: 'unique',
      name: 'MonthlyLogs_tenantId_term_month_key'
    });
    await queryInterface.addConstraint('CrossSlips', {
      fields: ['tenantId', 'year', 'month', 'no'],
      type: 'unique',
      name: 'CrossSlips_tenantId_year_month_no_key'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('Accounts', 'Accounts_tenantId_accountCode_key');
    await queryInterface.removeConstraint('AccountRemainings', 'AccountRemainings_tenantId_term_accountId_key');
    await queryInterface.removeConstraint('MonthlyLogs', 'MonthlyLogs_tenantId_term_month_key');
    await queryInterface.removeConstraint('CrossSlips', 'CrossSlips_tenantId_year_month_no_key');

    await queryInterface.addConstraint('Accounts', {
      fields: ['accountCode'],
      type: 'unique',
      name: 'Accounts_accountCode_key'
    });
    await queryInterface.addConstraint('AccountRemainings', {
      fields: ['term', 'accountId'],
      type: 'unique',
      name: 'AccountRemainings_term_accountId_key'
    });
    await queryInterface.addConstraint('MonthlyLogs', {
      fields: ['term', 'month'],
      type: 'unique',
      name: 'MonthlyLogs_term_month_key'
    });
    await queryInterface.addConstraint('CrossSlips', {
      fields: ['year', 'month', 'no'],
      type: 'unique',
      name: 'CrossSlips_year_month_no_key'
    });
  },
};
