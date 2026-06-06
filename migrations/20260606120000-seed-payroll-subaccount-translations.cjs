'use strict';

/**
 * Issue #186 — Seed payroll sub-account name translations
 *
 * Sub-accounts under 預り金 (源泉所得税, 健康保険料, 厚生年金保険料, 住民税)
 * were missing from Translation seeds, causing ja-only display in ledger tabs.
 *
 * Also seeds 雇用保険料 and 介護保険料 as common siblings.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const nameMap = {
      '源泉所得税':     ['Thuế TNCN khấu trừ tại nguồn', 'Withholding income tax'],
      '健康保険料':     ['Phí bảo hiểm y tế',             'Health insurance premium'],
      '厚生年金保険料': ['Phí bảo hiểm lương hưu',        'Employees\' pension insurance premium'],
      '住民税':         ['Thuế cư trú',                    'Resident tax'],
      '雇用保険料':     ['Phí bảo hiểm thất nghiệp',      'Employment insurance premium'],
      '介護保険料':     ['Phí bảo hiểm chăm sóc dài hạn', 'Long-term care insurance premium']
    };

    const records = [];
    for (const [ja, [vi, en]] of Object.entries(nameMap)) {
      records.push({
        tableName: 'Account', recordKey: `name:${ja}`, field: 'name',
        language: 'vi', value: vi, tenantId: null, createdAt: now, updatedAt: now
      });
      records.push({
        tableName: 'Account', recordKey: `name:${ja}`, field: 'name',
        language: 'en', value: en, tenantId: null, createdAt: now, updatedAt: now
      });
      records.push({
        tableName: 'SubAccount', recordKey: `name:${ja}`, field: 'name',
        language: 'vi', value: vi, tenantId: null, createdAt: now, updatedAt: now
      });
      records.push({
        tableName: 'SubAccount', recordKey: `name:${ja}`, field: 'name',
        language: 'en', value: en, tenantId: null, createdAt: now, updatedAt: now
      });
    }

    if (records.length > 0) {
      await queryInterface.bulkInsert('Translations', records);
    }
  },

  async down(queryInterface) {
    const jaNames = [
      '源泉所得税', '健康保険料', '厚生年金保険料', '住民税',
      '雇用保険料', '介護保険料'
    ];
    await queryInterface.bulkDelete('Translations', {
      tenantId: null,
      tableName: ['Account', 'SubAccount'],
      field: 'name',
      recordKey: jaNames.map((n) => `name:${n}`)
    });
  }
};
