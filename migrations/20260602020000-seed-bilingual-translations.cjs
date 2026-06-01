'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Build translation records: { tableName, recordKey, field, language, value }
    const records = [];

    // Helper
    const T = (tableName, recordKey, field, vi) => {
      records.push({ tableName, recordKey, field, language: 'vi', value: vi, createdAt: now, updatedAt: now });
    };

    // =====================================================
    // AccountClass — translations keyed by (major, middle, minor) logical name
    // =====================================================

    // --- major ---
    T('AccountClass', 'major:資産', 'major', 'Tài sản');
    T('AccountClass', 'major:負債', 'major', 'Nợ phải trả');
    T('AccountClass', 'major:純資産', 'major', 'Vốn chủ sở hữu');
    T('AccountClass', 'major:経常損益', 'major', 'Lãi/lỗ hoạt động');

    // --- middle ---
    T('AccountClass', 'middle:流動資産', 'middle', 'Tài sản ngắn hạn');
    T('AccountClass', 'middle:有形固定資産', 'middle', 'TSCĐ hữu hình');
    T('AccountClass', 'middle:無形固定資産', 'middle', 'TSCĐ vô hình');
    T('AccountClass', 'middle:投資等', 'middle', 'Đầu tư');
    T('AccountClass', 'middle:繰延資産', 'middle', 'Tài sản dài hạn khác');
    T('AccountClass', 'middle:事業主貸', 'middle', 'Chủ DN vay');
    T('AccountClass', 'middle:流動負債', 'middle', 'Nợ ngắn hạn');
    T('AccountClass', 'middle:固定負債', 'middle', 'Nợ dài hạn');
    T('AccountClass', 'middle:事業主借', 'middle', 'Chủ DN cho vay');
    T('AccountClass', 'middle:株主資本', 'middle', 'Vốn cổ đông');
    T('AccountClass', 'middle:元入金', 'middle', 'Vốn góp');
    T('AccountClass', 'middle:売上高', 'middle', 'Doanh thu');
    T('AccountClass', 'middle:売上原価', 'middle', 'Giá vốn hàng bán');
    T('AccountClass', 'middle:営業外収益', 'middle', 'Thu nhập ngoài HĐ');
    T('AccountClass', 'middle:営業外費用', 'middle', 'Chi phí ngoài HĐ');

    // --- minor ---
    const minorMap = {
      '現金': 'Tiền mặt', '預金': 'Tiền gửi NH', '受取手形': 'Thương phiếu phải thu',
      '売掛金': 'Phải thu khách hàng', '貸倒引当金': 'Dự phòng nợ khó đòi',
      '有価証券': 'Chứng khoán', '商品': 'Hàng hóa', '仕掛品': 'Sản phẩm dở dang',
      '材料': 'Nguyên vật liệu', '前渡金': 'Tiền ứng trước', '前払い費用': 'Chi phí trả trước',
      '未収入金': 'Thu nhập chưa thu', '短期貸付金': 'Cho vay ngắn hạn',
      '仮払金': 'Tạm ứng', '仮払消費税': 'Thuế tiêu dùng tạm trả',
      '建物': 'Nhà cửa', '土地': 'Đất đai', '車両': 'Xe cộ',
      '無形固定資産': 'TSCĐ vô hình', '投資等': 'Đầu tư',
      '繰延資産': 'Tài sản dài hạn khác', '事業主貸': 'Chủ DN vay',
      '買掛金': 'Phải trả người bán', '短期借入金': 'Vay ngắn hạn',
      '未払金': 'Phải trả khác', '未払法人税等': 'Thuế TNDN phải trả',
      '未払消費税': 'Thuế tiêu dùng phải trả', '預り金': 'Tiền giữ hộ',
      '前受金': 'Doanh thu chưa thực hiện', '未払い給与': 'Lương phải trả',
      '仮受消費税': 'Thuế tiêu dùng tạm nhận', '長期借入金': 'Vay dài hạn',
      '事業主借': 'Chủ DN cho vay', '資本金': 'Vốn điều lệ',
      '資本剰余金': 'Thặng dư vốn', '自己株式': 'Cổ phiếu quỹ',
      '利益剰余金': 'Lợi nhuận giữ lại', 'その他利益剰余金': 'LN giữ lại khác',
      '元入金': 'Vốn góp', '売上高': 'Doanh thu', '仕入高': 'Mua vào',
      '外注費': 'Chi phí gia công ngoài', '棚卸高': 'Hàng tồn kho',
      '販売費一般管理費': 'CP bán hàng & quản lý', '受取利息': 'Lãi tiền gửi',
      '受取配当金': 'Cổ tức nhận được', '雑収入': 'Thu nhập khác',
      '支払利息': 'Chi phí lãi vay', '特別利益': 'Lợi nhuận bất thường',
      '特別損失': 'Lỗ bất thường', '法人税住民税等': 'Thuế TNDN & cư trú',
      '開業費償却': 'Khấu hao CP khởi nghiệp'
    };
    for (const [ja, vi] of Object.entries(minorMap)) {
      T('AccountClass', `minor:${ja}`, 'minor', vi);
    }

    // =====================================================
    // CompanyClass
    // =====================================================
    const companyClassMap = {
      '国内購買先': 'Nhà cung cấp nội địa',
      '海外購買先': 'Nhà cung cấp nước ngoài',
      '国内外注': 'Gia công nội địa',
      '海外外注': 'Gia công nước ngoài',
      '国内顧客': 'Khách hàng nội địa',
      '海外顧客': 'Khách hàng nước ngoài',
      '税金公共料金等': 'Thuế & phí công cộng',
      '自社': 'Công ty mình'
    };
    for (const [ja, vi] of Object.entries(companyClassMap)) {
      T('CompanyClass', `name:${ja}`, 'name', vi);
    }

    // =====================================================
    // Menu — template titles (keyed by logical title)
    // =====================================================
    const menuMap = {
      '白紙のメニュー': 'Menu trống',
      'ホーム': 'Trang chủ',
      '会計メニュー': 'Menu kế toán',
      '顧客管理': 'Quản lý khách hàng',
      '人事管理': 'Quản lý nhân sự',
      'システム管理': 'Quản lý hệ thống',
      '年度選択': 'Chọn niên độ',
      '帳票出力': 'Xuất báo cáo',
      'バックアップ': 'Sao lưu',
      '承認待ち': 'Chờ phê duyệt',
      'パスワード変更': 'Đổi mật khẩu',
      '仕訳日記帳': 'Sổ nhật ký',
      '元帳': 'Sổ cái',
      '銀行元帳': 'Sổ cái ngân hàng',
      '残高試算表': 'Bảng cân đối số dư',
      '推移表': 'Biểu đồ xu hướng',
      '取引先管理:国内購買先': 'QL đối tác: NCC nội địa',
      '取引先管理:国内顧客': 'QL đối tác: KH nội địa',
      '受取請求書': 'Hóa đơn nhận',
      '受取領収書': 'Biên lai nhận',
      '差出請求書': 'Hóa đơn phát hành',
      '差出領収書': 'Biên lai phát hành',
      '勘定科目管理': 'Quản lý tài khoản',
      '顧客管理(国内)': 'QL khách hàng (nội địa)',
      '顧客管理(海外)': 'QL khách hàng (nước ngoài)',
      '案件管理': 'Quản lý dự án',
      '取引管理': 'Quản lý giao dịch',
      '品目管理': 'Quản lý mặt hàng',
      '役職員管理': 'Quản lý nhân viên',
      '取引先種別': 'Loại đối tác',
      '取引文書種別': 'Loại chứng từ GD',
      '証憑種別': 'Loại chứng từ',
      '品目種別': 'Loại mặt hàng'
    };
    for (const [ja, vi] of Object.entries(menuMap)) {
      T('Menu', `title:${ja}`, 'title', vi);
    }

    // =====================================================
    // Insert all records
    // =====================================================
    if (records.length > 0) {
      await queryInterface.bulkInsert('Translations', records);
    }
  },

  async down(queryInterface) {
    // Delete all seed translations (WHERE tenantId IS NULL = system seeded)
    await queryInterface.bulkDelete('Translations', { tenantId: null });
  }
};
