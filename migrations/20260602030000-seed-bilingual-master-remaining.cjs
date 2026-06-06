'use strict';

/**
 * Seed ja->vi translations for the remaining master/reference tables:
 * ItemClass, TransactionKind, VoucherClass, MemberClass, TaxRule.
 *
 * Keyed by stable business value (name/label/title), NOT by row id,
 * because these tables use per-tenant autoincrement ids while these
 * translation rows are system-wide (tenantId = null). See
 * libs/bilingual-helper.js TRANSLATION_MAP.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const records = [];
    const T = (tableName, recordKey, field, vi) => {
      records.push({ tableName, recordKey, field, language: 'vi', value: vi, createdAt: now, updatedAt: now });
    };

    // ItemClass.name
    const itemClassMap = {
      '商品(有形物)': 'Hàng hóa (hữu hình)',
      'サービス(無形物)': 'Dịch vụ (vô hình)'
    };
    for (const [ja, vi] of Object.entries(itemClassMap)) T('ItemClass', `name:${ja}`, 'name', vi);

    // TransactionKind.label
    const transactionKindMap = {
      '見積': 'Báo giá',
      '注文請書': 'Xác nhận đơn hàng',
      '納品': 'Giao hàng',
      '請求': 'Yêu cầu thanh toán',
      '領収': 'Biên lai',
      '議事録': 'Biên bản họp',
      '報告書': 'Báo cáo'
    };
    for (const [ja, vi] of Object.entries(transactionKindMap)) T('TransactionKind', `label:${ja}`, 'label', vi);

    // VoucherClass.name
    const voucherClassMap = {
      '受取請求書': 'Hóa đơn nhận',
      '受取領収書': 'Biên lai nhận',
      '差出請求書': 'Hóa đơn phát hành',
      '差出領収書': 'Biên lai phát hành',
      '差出見積書': 'Báo giá phát hành'
    };
    for (const [ja, vi] of Object.entries(voucherClassMap)) T('VoucherClass', `name:${ja}`, 'name', vi);

    // MemberClass.title
    const memberClassMap = {
      '正社員': 'Nhân viên chính thức',
      '常勤役員': 'Thành viên HĐQT thường trực',
      '非常勤役員': 'Thành viên HĐQT không thường trực',
      '管理職': 'Quản lý',
      'パートタイマ': 'Nhân viên bán thời gian',
      'アルバイト': 'Nhân viên thời vụ',
      '常勤派遣': 'Nhân viên phái cử thường trực'
    };
    for (const [ja, vi] of Object.entries(memberClassMap)) T('MemberClass', `title:${ja}`, 'title', vi);

    // TaxRule.label (note: '非課税' appears for two ids; keyed by label so it dedupes)
    const taxRuleMap = {
      '非課税': 'Không chịu thuế',
      '内税 10%': 'Thuế gồm trong giá 10%',
      '外税 10%': 'Thuế ngoài giá 10%',
      '内税 軽減(8%)': 'Thuế gồm trong giá ưu đãi (8%)',
      '外税 軽減(8%)': 'Thuế ngoài giá ưu đãi (8%)'
    };
    for (const [ja, vi] of Object.entries(taxRuleMap)) T('TaxRule', `label:${ja}`, 'label', vi);

    if (records.length > 0) {
      await queryInterface.bulkInsert('Translations', records);
    }
  },

  async down(queryInterface) {
    const Op = queryInterface.sequelize.Sequelize.Op;
    await queryInterface.bulkDelete('Translations', {
      tenantId: null,
      tableName: { [Op.in]: ['ItemClass', 'TransactionKind', 'VoucherClass', 'MemberClass', 'TaxRule'] }
    });
  }
};
