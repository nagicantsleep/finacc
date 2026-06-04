'use strict';

/**
 * Issue #137 — Seed Translations for Account.name and SubAccount.name
 *
 * Background: PR #133 wired enrichBilingual('Account', ...) to lookup
 * `Translation` rows keyed by `name:${rec.name}`. The original seed
 * migration (20260602020000) only seeded AccountClass.{major,middle,minor},
 * not Account.name. Result: ledger AccountSelect dropdown items fall back
 * to Japanese-only.
 *
 * This migration re-uses the AccountClass.minor map (45 entries) as the
 * canonical Account.name → vi translation table. The codebase uses the same
 * Japanese name set for both AccountClass.minor and Account.name.
 *
 * Also seeds English translations for the same 45 entries so languagePair
 * (日本語/English) also works.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // (ja, vi, en) — same set as AccountClass.minor in
    // migrations/20260602020000-seed-bilingual-translations.cjs
    const nameMap = {
      // 資産 (Assets)
      '現金':       ['Tiền mặt',            'Cash on hand'],
      '預金':       ['Tiền gửi NH',         'Bank deposits'],
      '受取手形':   ['Thương phiếu phải thu', 'Notes receivable'],
      '売掛金':     ['Phải thu khách hàng', 'Accounts receivable'],
      '貸倒引当金': ['Dự phòng nợ khó đòi', 'Allowance for doubtful accounts'],
      '有価証券':   ['Chứng khoán',         'Securities'],
      '商品':       ['Hàng hóa',            'Merchandise'],
      '仕掛品':     ['Sản phẩm dở dang',   'Work in process'],
      '材料':       ['Nguyên vật liệu',     'Raw materials'],
      '前渡金':     ['Tiền ứng trước',      'Advances paid'],
      '前払い費用': ['Chi phí trả trước',    'Prepaid expenses'],
      '未収入金':   ['Thu nhập chưa thu',   'Accrued income'],
      '短期貸付金': ['Cho vay ngắn hạn',    'Short-term loans'],
      '仮払金':     ['Tạm ứng',             'Temporary payments'],
      '仮払消費税': ['Thuế tiêu dùng tạm trả', 'Temporary consumption tax paid'],
      '建物':       ['Nhà cửa',             'Buildings'],
      '土地':       ['Đất đai',             'Land'],
      '車両':       ['Xe cộ',               'Vehicles'],
      '繰延資産':   ['Tài sản dài hạn khác', 'Deferred assets'],
      '事業主貸':   ['Chủ DN vay',          'Owner draws'],
      // 負債 (Liabilities)
      '買掛金':         ['Phải trả người bán',   'Accounts payable'],
      '短期借入金':     ['Vay ngắn hạn',         'Short-term loans payable'],
      '未払金':         ['Phải trả khác',        'Accrued expenses'],
      '未払法人税等':   ['Thuế TNDN phải trả',    'Income tax payable'],
      '未払消費税':     ['Thuế tiêu dùng phải trả', 'Consumption tax payable'],
      '預り金':         ['Tiền giữ hộ',          'Deposits received'],
      '前受金':         ['Doanh thu chưa thực hiện', 'Unearned revenue'],
      '未払い給与':     ['Lương phải trả',        'Accrued salaries'],
      '仮受消費税':     ['Thuế tiêu dùng tạm nhận', 'Temporary consumption tax received'],
      '長期借入金':     ['Vay dài hạn',           'Long-term loans payable'],
      '事業主借':       ['Chủ DN cho vay',        'Owner contributions'],
      // 純資産 (Equity)
      '資本金':         ['Vốn điều lệ',          'Capital stock'],
      '資本剰余金':     ['Thặng dư vốn',          'Capital surplus'],
      '自己株式':       ['Cổ phiếu quỹ',         'Treasury stock'],
      '利益剰余金':     ['Lợi nhuận giữ lại',     'Retained earnings'],
      'その他利益剰余金': ['LN giữ lại khác',      'Other retained earnings'],
      '元入金':         ['Vốn góp',               'Owner equity'],
      // 収益/費用 (Revenue/Expense)
      '売上高':         ['Doanh thu',             'Sales'],
      '仕入高':         ['Mua vào',               'Purchases'],
      '外注費':         ['Chi phí gia công ngoài', 'Outsourcing expenses'],
      '棚卸高':         ['Hàng tồn kho',          'Inventory'],
      '販売費一般管理費': ['CP bán hàng & quản lý', 'SG&A expenses'],
      '受取利息':       ['Lãi tiền gửi',          'Interest income'],
      '受取配当金':     ['Cổ tức nhận được',      'Dividend income'],
      '雑収入':         ['Thu nhập khác',         'Miscellaneous income'],
      '支払利息':       ['Chi phí lãi vay',        'Interest expense'],
      '特別利益':       ['Lợi nhuận bất thường',  'Extraordinary gains'],
      '特別損失':       ['Lỗ bất thường',         'Extraordinary losses'],
      '法人税住民税等': ['Thuế TNDN & cư trú',    'Income & residence tax'],
      '開業費償却':     ['Khấu hao CP khởi nghiệp', 'Startup cost amortization']
    };

    const records = [];
    for (const [ja, [vi, en]] of Object.entries(nameMap)) {
      // Account.name — used by /api/accounts enrichBilingual('Account', ...)
      records.push({
        tableName: 'Account',
        recordKey: `name:${ja}`,
        field: 'name',
        language: 'vi',
        value: vi,
        tenantId: null,
        createdAt: now,
        updatedAt: now
      });
      records.push({
        tableName: 'Account',
        recordKey: `name:${ja}`,
        field: 'name',
        language: 'en',
        value: en,
        tenantId: null,
        createdAt: now,
        updatedAt: now
      });
      // SubAccount.name — same lookup pattern via enrichBilingual('SubAccount', ...)
      records.push({
        tableName: 'SubAccount',
        recordKey: `name:${ja}`,
        field: 'name',
        language: 'vi',
        value: vi,
        tenantId: null,
        createdAt: now,
        updatedAt: now
      });
      records.push({
        tableName: 'SubAccount',
        recordKey: `name:${ja}`,
        field: 'name',
        language: 'en',
        value: en,
        tenantId: null,
        createdAt: now,
        updatedAt: now
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
      field: 'name'
    });
  }
};
