'use strict';

/**
 * Issue #143 — Add missing Account.name + SubAccount.name translations
 *
 * Migration #137 seeded 50 Account.name translations, but missed 2
 * names that exist in the original AccountClass.minor seed:
 *   - 投資等 (Đầu tư / Investments)
 *   - 無形固定資産 (TSCĐ vô hình / Intangible fixed assets)
 *
 * Without these, accounts using these names silently fall back to
 * Japanese-only in the ledger dropdown.
 *
 * Adds 8 system-wide rows: 2 names × 2 fields (Account/SubAccount) ×
 * 2 languages (vi/en).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // (ja, vi, en) — names missing from migration #137
    const nameMap = {
      '投資等':           ['Đầu tư',                          'Investments'],
      '無形固定資産':     ['TSCĐ vô hình',                    'Intangible fixed assets']
    };

    const records = [];
    for (const [ja, [vi, en]] of Object.entries(nameMap)) {
      // Account.name
      records.push({
        tableName: 'Account', recordKey: `name:${ja}`, field: 'name',
        language: 'vi', value: vi, tenantId: null, createdAt: now, updatedAt: now
      });
      records.push({
        tableName: 'Account', recordKey: `name:${ja}`, field: 'name',
        language: 'en', value: en, tenantId: null, createdAt: now, updatedAt: now
      });
      // SubAccount.name
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
    await queryInterface.bulkDelete('Translations', {
      tenantId: null,
      tableName: ['Account', 'SubAccount'],
      field: 'name',
      recordKey: ['name:投資等', 'name:無形固定資産']
    });
  }
};
