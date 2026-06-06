'use strict';

/**
 * Issue #145 — Add 44 additional Account.name + SubAccount.name translations
 *
 * Migrations #137 (50) + #143 (2) = 52 Account.name translations.
 * DB has 83 distinct Account.name values (across all tenants), so
 * 44 names still fall back to Japanese-only in the ledger dropdown.
 *
 * This migration seeds the remaining 44 names discovered by diffing
 * `SELECT DISTINCT name FROM "Accounts"` against seeded recordKeys.
 *
 * Adds 176 system-wide rows: 44 names × 2 fields (Account/SubAccount) ×
 * 2 languages (vi/en).
 *
 * Note: `有価證券` (traditional 證) is preserved as-is from DB to match
 * the exact recordKey for lookup. `有価証券` (shinjitai 証) is a separate
 * name and was already seeded in #137.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // (ja, vi, en) — 44 names missing from #137 + #143
    const nameMap = {
      // 資産 (assets/中間)
      'ソフトウェア':       ['Phần mềm',                       'Software'],
      '保険料':             ['Phí bảo hiểm',                   'Insurance premium'],
      '出資金':             ['Góp vốn',                        'Investment in capital'],
      '創立費':             ['CP thành lập',                    'Organization costs'],
      '原材料':             ['Nguyên liệu thô',                'Raw materials'],
      '商標権':             ['Quyền nhãn hiệu',                'Trademark rights'],
      '営業権':             ['Uy tín thương mại',               'Goodwill'],
      '差入保証金':         ['Đặt cọc ký quỹ',                 'Guarantee deposits paid'],
      '投資有価証券':       ['Chứng khoán đầu tư',              'Investment securities'],
      '敷金':               ['Tiền đặt cọc',                   'Lease deposits'],
      '普通預金':           ['Tiền gửi không kỳ hạn',          'Ordinary deposits'],
      '有価證券':           ['Chứng khoán (chữ Hán cổ)',       'Securities (traditional)'],
      '長期前払費用':       ['CP trả trước dài hạn',            'Long-term prepaid expenses'],
      '長期貸付金':         ['Cho vay dài hạn',                 'Long-term loans receivable'],
      // 純資産
      '利益準備金':         ['Quỹ dự phòng lợi nhuận',          'Legal earned reserve'],
      '繰越利益剰余金':     ['LN giữ lại chuyển sang',          'Retained earnings carried forward'],
      '資本準備金':         ['Thặng dư vốn cổ phần',            'Legal capital surplus'],
      // 売上高
      '売上返金':           ['Hoàn trả doanh thu',              'Sales returns'],
      // 売上原価 + 販管費
      '地代家賃':           ['Tiền thuê nhà đất',               'Rent expense'],
      '報酬料金':           ['Phí hoa hồng',                    'Fees and commissions'],
      '期末商品棚卸高':     ['Tồn kho cuối kỳ',                'Ending merchandise inventory'],
      '期首商品棚卸高':     ['Tồn kho đầu kỳ',                 'Beginning merchandise inventory'],
      '役員報酬':           ['Thù lao cán bộ',                  'Directors compensation'],
      '支払手数料':         ['Phí giao dịch',                   'Bank transaction fees'],
      '旅費交通費':         ['CP đi lại',                       'Travel and transportation'],
      '広告宣伝費':         ['CP quảng cáo & tuyên truyền',     'Advertising expenses'],
      '通信費':             ['CP viễn thông',                   'Communication expenses'],
      '荷造発送費':         ['CP đóng gói vận chuyển',          'Packing and shipping'],
      '水道光熱費':         ['CP điện nước',                    'Utilities'],
      '諸会費':             ['Phí hội viên',                    'Membership fees'],
      '租税公課':           ['Thuế & phí công cộng',             'Taxes and public charges'],
      '給料手当':           ['Tiền lương & phụ cấp',             'Salaries and allowances'],
      '法定福利費':         ['Phúc lợi theo luật',              'Legal welfare expenses'],
      '福利厚生費':         ['Phúc lợi nhân viên',               'Employee welfare'],
      '消耗品費':           ['CP vật liệu tiêu hao',            'Supplies expense'],
      '車両運搬費':         ['CP vận chuyển xe cộ',              'Vehicle transportation'],
      '減価償却費':         ['CP khấu hao',                     'Depreciation expense'],
      '雑費':               ['CP linh tinh khác',                'Miscellaneous expenses'],
      '開業費':             ['CP khởi nghiệp',                   'Startup costs'],
      // 営業外 + その他
      '貸倒損失':           ['Lỗ do xóa nợ',                    'Bad debt loss'],
      '雑損失':             ['Lỗ bất thường khác',              'Miscellaneous loss'],
      // 預金 variants
      '定期預金':           ['Tiền gửi có kỳ hạn',              'Time deposits'],
      '定期積立':           ['Tích lũy định kỳ',                'Periodic savings'],
      '当座預金':           ['Tiền gửi thanh toán',             'Checking deposits']
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
    // Re-derive recordKeys from the same map (literal — kept in sync with up()).
    const jaNames = [
      'ソフトウェア','保険料','出資金','創立費','原材料','商標権','営業権',
      '差入保証金','投資有価証券','敷金','普通預金','有価證券','長期前払費用',
      '長期貸付金','利益準備金','繰越利益剰余金','資本準備金','売上返金',
      '地代家賃','報酬料金','期末商品棚卸高','期首商品棚卸高','役員報酬',
      '支払手数料','旅費交通費','広告宣伝費','通信費','荷造発送費',
      '水道光熱費','諸会費','租税公課','給料手当','法定福利費',
      '福利厚生費','消耗品費','車両運搬費','減価償却費','雑費',
      '貸倒損失','雑損失','定期預金','定期積立','当座預金','開業費'
    ];
    await queryInterface.bulkDelete('Translations', {
      tenantId: null,
      tableName: ['Account', 'SubAccount'],
      field: 'name',
      recordKey: jaNames.map(n => `name:${n}`)
    });
  }
};
