'use strict';

/**
 * System Translations Seed Migration
 * Consolidated from 6 bilingual seed migrations.
 * Total verified system translations: 546.
 */
const SYSTEM_TRANSLATIONS = [
  {
    "tableName": "Account",
    "recordKey": "name:その他利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Other retained earnings"
  },
  {
    "tableName": "Account",
    "recordKey": "name:その他利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "LN giữ lại khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:ソフトウェア",
    "field": "name",
    "language": "en",
    "value": "Software"
  },
  {
    "tableName": "Account",
    "recordKey": "name:ソフトウェア",
    "field": "name",
    "language": "vi",
    "value": "Phần mềm"
  },
  {
    "tableName": "Account",
    "recordKey": "name:事業主借",
    "field": "name",
    "language": "en",
    "value": "Owner contributions"
  },
  {
    "tableName": "Account",
    "recordKey": "name:事業主借",
    "field": "name",
    "language": "vi",
    "value": "Chủ DN cho vay"
  },
  {
    "tableName": "Account",
    "recordKey": "name:事業主貸",
    "field": "name",
    "language": "en",
    "value": "Owner draws"
  },
  {
    "tableName": "Account",
    "recordKey": "name:事業主貸",
    "field": "name",
    "language": "vi",
    "value": "Chủ DN vay"
  },
  {
    "tableName": "Account",
    "recordKey": "name:介護保険料",
    "field": "name",
    "language": "en",
    "value": "Long-term care insurance premium"
  },
  {
    "tableName": "Account",
    "recordKey": "name:介護保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm chăm sóc dài hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仕入高",
    "field": "name",
    "language": "en",
    "value": "Purchases"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仕入高",
    "field": "name",
    "language": "vi",
    "value": "Mua vào"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仕掛品",
    "field": "name",
    "language": "en",
    "value": "Work in process"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仕掛品",
    "field": "name",
    "language": "vi",
    "value": "Sản phẩm dở dang"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮受消費税",
    "field": "name",
    "language": "en",
    "value": "Temporary consumption tax received"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮受消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm nhận"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮払消費税",
    "field": "name",
    "language": "en",
    "value": "Temporary consumption tax paid"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮払消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm trả"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮払金",
    "field": "name",
    "language": "en",
    "value": "Temporary payments"
  },
  {
    "tableName": "Account",
    "recordKey": "name:仮払金",
    "field": "name",
    "language": "vi",
    "value": "Tạm ứng"
  },
  {
    "tableName": "Account",
    "recordKey": "name:住民税",
    "field": "name",
    "language": "en",
    "value": "Resident tax"
  },
  {
    "tableName": "Account",
    "recordKey": "name:住民税",
    "field": "name",
    "language": "vi",
    "value": "Thuế cư trú"
  },
  {
    "tableName": "Account",
    "recordKey": "name:保険料",
    "field": "name",
    "language": "en",
    "value": "Insurance premium"
  },
  {
    "tableName": "Account",
    "recordKey": "name:保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm"
  },
  {
    "tableName": "Account",
    "recordKey": "name:健康保険料",
    "field": "name",
    "language": "en",
    "value": "Health insurance premium"
  },
  {
    "tableName": "Account",
    "recordKey": "name:健康保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm y tế"
  },
  {
    "tableName": "Account",
    "recordKey": "name:元入金",
    "field": "name",
    "language": "en",
    "value": "Owner equity"
  },
  {
    "tableName": "Account",
    "recordKey": "name:元入金",
    "field": "name",
    "language": "vi",
    "value": "Vốn góp"
  },
  {
    "tableName": "Account",
    "recordKey": "name:出資金",
    "field": "name",
    "language": "en",
    "value": "Investment in capital"
  },
  {
    "tableName": "Account",
    "recordKey": "name:出資金",
    "field": "name",
    "language": "vi",
    "value": "Góp vốn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Retained earnings"
  },
  {
    "tableName": "Account",
    "recordKey": "name:利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "Lợi nhuận giữ lại"
  },
  {
    "tableName": "Account",
    "recordKey": "name:利益準備金",
    "field": "name",
    "language": "en",
    "value": "Legal earned reserve"
  },
  {
    "tableName": "Account",
    "recordKey": "name:利益準備金",
    "field": "name",
    "language": "vi",
    "value": "Quỹ dự phòng lợi nhuận"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前受金",
    "field": "name",
    "language": "en",
    "value": "Unearned revenue"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前受金",
    "field": "name",
    "language": "vi",
    "value": "Doanh thu chưa thực hiện"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前払い費用",
    "field": "name",
    "language": "en",
    "value": "Prepaid expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前払い費用",
    "field": "name",
    "language": "vi",
    "value": "Chi phí trả trước"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前渡金",
    "field": "name",
    "language": "en",
    "value": "Advances paid"
  },
  {
    "tableName": "Account",
    "recordKey": "name:前渡金",
    "field": "name",
    "language": "vi",
    "value": "Tiền ứng trước"
  },
  {
    "tableName": "Account",
    "recordKey": "name:創立費",
    "field": "name",
    "language": "en",
    "value": "Organization costs"
  },
  {
    "tableName": "Account",
    "recordKey": "name:創立費",
    "field": "name",
    "language": "vi",
    "value": "CP thành lập"
  },
  {
    "tableName": "Account",
    "recordKey": "name:厚生年金保険料",
    "field": "name",
    "language": "en",
    "value": "Employees' pension insurance premium"
  },
  {
    "tableName": "Account",
    "recordKey": "name:厚生年金保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm lương hưu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:原材料",
    "field": "name",
    "language": "en",
    "value": "Raw materials"
  },
  {
    "tableName": "Account",
    "recordKey": "name:原材料",
    "field": "name",
    "language": "vi",
    "value": "Nguyên liệu thô"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取利息",
    "field": "name",
    "language": "en",
    "value": "Interest income"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取利息",
    "field": "name",
    "language": "vi",
    "value": "Lãi tiền gửi"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取手形",
    "field": "name",
    "language": "en",
    "value": "Notes receivable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取手形",
    "field": "name",
    "language": "vi",
    "value": "Thương phiếu phải thu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取配当金",
    "field": "name",
    "language": "en",
    "value": "Dividend income"
  },
  {
    "tableName": "Account",
    "recordKey": "name:受取配当金",
    "field": "name",
    "language": "vi",
    "value": "Cổ tức nhận được"
  },
  {
    "tableName": "Account",
    "recordKey": "name:商品",
    "field": "name",
    "language": "en",
    "value": "Merchandise"
  },
  {
    "tableName": "Account",
    "recordKey": "name:商品",
    "field": "name",
    "language": "vi",
    "value": "Hàng hóa"
  },
  {
    "tableName": "Account",
    "recordKey": "name:商標権",
    "field": "name",
    "language": "en",
    "value": "Trademark rights"
  },
  {
    "tableName": "Account",
    "recordKey": "name:商標権",
    "field": "name",
    "language": "vi",
    "value": "Quyền nhãn hiệu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:営業権",
    "field": "name",
    "language": "en",
    "value": "Goodwill"
  },
  {
    "tableName": "Account",
    "recordKey": "name:営業権",
    "field": "name",
    "language": "vi",
    "value": "Uy tín thương mại"
  },
  {
    "tableName": "Account",
    "recordKey": "name:土地",
    "field": "name",
    "language": "en",
    "value": "Land"
  },
  {
    "tableName": "Account",
    "recordKey": "name:土地",
    "field": "name",
    "language": "vi",
    "value": "Đất đai"
  },
  {
    "tableName": "Account",
    "recordKey": "name:地代家賃",
    "field": "name",
    "language": "en",
    "value": "Rent expense"
  },
  {
    "tableName": "Account",
    "recordKey": "name:地代家賃",
    "field": "name",
    "language": "vi",
    "value": "Tiền thuê nhà đất"
  },
  {
    "tableName": "Account",
    "recordKey": "name:報酬料金",
    "field": "name",
    "language": "en",
    "value": "Fees and commissions"
  },
  {
    "tableName": "Account",
    "recordKey": "name:報酬料金",
    "field": "name",
    "language": "vi",
    "value": "Phí hoa hồng"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売上返金",
    "field": "name",
    "language": "en",
    "value": "Sales returns"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売上返金",
    "field": "name",
    "language": "vi",
    "value": "Hoàn trả doanh thu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売上高",
    "field": "name",
    "language": "en",
    "value": "Sales"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売上高",
    "field": "name",
    "language": "vi",
    "value": "Doanh thu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売掛金",
    "field": "name",
    "language": "en",
    "value": "Accounts receivable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:売掛金",
    "field": "name",
    "language": "vi",
    "value": "Phải thu khách hàng"
  },
  {
    "tableName": "Account",
    "recordKey": "name:外注費",
    "field": "name",
    "language": "en",
    "value": "Outsourcing expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:外注費",
    "field": "name",
    "language": "vi",
    "value": "Chi phí gia công ngoài"
  },
  {
    "tableName": "Account",
    "recordKey": "name:定期積立",
    "field": "name",
    "language": "en",
    "value": "Periodic savings"
  },
  {
    "tableName": "Account",
    "recordKey": "name:定期積立",
    "field": "name",
    "language": "vi",
    "value": "Tích lũy định kỳ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:定期預金",
    "field": "name",
    "language": "en",
    "value": "Time deposits"
  },
  {
    "tableName": "Account",
    "recordKey": "name:定期預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi có kỳ hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:差入保証金",
    "field": "name",
    "language": "en",
    "value": "Guarantee deposits paid"
  },
  {
    "tableName": "Account",
    "recordKey": "name:差入保証金",
    "field": "name",
    "language": "vi",
    "value": "Đặt cọc ký quỹ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:広告宣伝費",
    "field": "name",
    "language": "en",
    "value": "Advertising expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:広告宣伝費",
    "field": "name",
    "language": "vi",
    "value": "CP quảng cáo & tuyên truyền"
  },
  {
    "tableName": "Account",
    "recordKey": "name:建物",
    "field": "name",
    "language": "en",
    "value": "Buildings"
  },
  {
    "tableName": "Account",
    "recordKey": "name:建物",
    "field": "name",
    "language": "vi",
    "value": "Nhà cửa"
  },
  {
    "tableName": "Account",
    "recordKey": "name:当座預金",
    "field": "name",
    "language": "en",
    "value": "Checking deposits"
  },
  {
    "tableName": "Account",
    "recordKey": "name:当座預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi thanh toán"
  },
  {
    "tableName": "Account",
    "recordKey": "name:役員報酬",
    "field": "name",
    "language": "en",
    "value": "Directors compensation"
  },
  {
    "tableName": "Account",
    "recordKey": "name:役員報酬",
    "field": "name",
    "language": "vi",
    "value": "Thù lao cán bộ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:投資有価証券",
    "field": "name",
    "language": "en",
    "value": "Investment securities"
  },
  {
    "tableName": "Account",
    "recordKey": "name:投資有価証券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán đầu tư"
  },
  {
    "tableName": "Account",
    "recordKey": "name:投資等",
    "field": "name",
    "language": "en",
    "value": "Investments"
  },
  {
    "tableName": "Account",
    "recordKey": "name:投資等",
    "field": "name",
    "language": "vi",
    "value": "Đầu tư"
  },
  {
    "tableName": "Account",
    "recordKey": "name:支払利息",
    "field": "name",
    "language": "en",
    "value": "Interest expense"
  },
  {
    "tableName": "Account",
    "recordKey": "name:支払利息",
    "field": "name",
    "language": "vi",
    "value": "Chi phí lãi vay"
  },
  {
    "tableName": "Account",
    "recordKey": "name:支払手数料",
    "field": "name",
    "language": "en",
    "value": "Bank transaction fees"
  },
  {
    "tableName": "Account",
    "recordKey": "name:支払手数料",
    "field": "name",
    "language": "vi",
    "value": "Phí giao dịch"
  },
  {
    "tableName": "Account",
    "recordKey": "name:敷金",
    "field": "name",
    "language": "en",
    "value": "Lease deposits"
  },
  {
    "tableName": "Account",
    "recordKey": "name:敷金",
    "field": "name",
    "language": "vi",
    "value": "Tiền đặt cọc"
  },
  {
    "tableName": "Account",
    "recordKey": "name:旅費交通費",
    "field": "name",
    "language": "en",
    "value": "Travel and transportation"
  },
  {
    "tableName": "Account",
    "recordKey": "name:旅費交通費",
    "field": "name",
    "language": "vi",
    "value": "CP đi lại"
  },
  {
    "tableName": "Account",
    "recordKey": "name:普通預金",
    "field": "name",
    "language": "en",
    "value": "Ordinary deposits"
  },
  {
    "tableName": "Account",
    "recordKey": "name:普通預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi không kỳ hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:有価証券",
    "field": "name",
    "language": "en",
    "value": "Securities"
  },
  {
    "tableName": "Account",
    "recordKey": "name:有価証券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán"
  },
  {
    "tableName": "Account",
    "recordKey": "name:有価證券",
    "field": "name",
    "language": "en",
    "value": "Securities (traditional)"
  },
  {
    "tableName": "Account",
    "recordKey": "name:有価證券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán (chữ Hán cổ)"
  },
  {
    "tableName": "Account",
    "recordKey": "name:期末商品棚卸高",
    "field": "name",
    "language": "en",
    "value": "Ending merchandise inventory"
  },
  {
    "tableName": "Account",
    "recordKey": "name:期末商品棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Tồn kho cuối kỳ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:期首商品棚卸高",
    "field": "name",
    "language": "en",
    "value": "Beginning merchandise inventory"
  },
  {
    "tableName": "Account",
    "recordKey": "name:期首商品棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Tồn kho đầu kỳ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未収入金",
    "field": "name",
    "language": "en",
    "value": "Accrued income"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未収入金",
    "field": "name",
    "language": "vi",
    "value": "Thu nhập chưa thu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払い給与",
    "field": "name",
    "language": "en",
    "value": "Accrued salaries"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払い給与",
    "field": "name",
    "language": "vi",
    "value": "Lương phải trả"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払法人税等",
    "field": "name",
    "language": "en",
    "value": "Income tax payable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払法人税等",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNDN phải trả"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払消費税",
    "field": "name",
    "language": "en",
    "value": "Consumption tax payable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng phải trả"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払金",
    "field": "name",
    "language": "en",
    "value": "Accrued expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:未払金",
    "field": "name",
    "language": "vi",
    "value": "Phải trả khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:材料",
    "field": "name",
    "language": "en",
    "value": "Raw materials"
  },
  {
    "tableName": "Account",
    "recordKey": "name:材料",
    "field": "name",
    "language": "vi",
    "value": "Nguyên vật liệu"
  },
  {
    "tableName": "Account",
    "recordKey": "name:棚卸高",
    "field": "name",
    "language": "en",
    "value": "Inventory"
  },
  {
    "tableName": "Account",
    "recordKey": "name:棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Hàng tồn kho"
  },
  {
    "tableName": "Account",
    "recordKey": "name:水道光熱費",
    "field": "name",
    "language": "en",
    "value": "Utilities"
  },
  {
    "tableName": "Account",
    "recordKey": "name:水道光熱費",
    "field": "name",
    "language": "vi",
    "value": "CP điện nước"
  },
  {
    "tableName": "Account",
    "recordKey": "name:法人税住民税等",
    "field": "name",
    "language": "en",
    "value": "Income & residence tax"
  },
  {
    "tableName": "Account",
    "recordKey": "name:法人税住民税等",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNDN & cư trú"
  },
  {
    "tableName": "Account",
    "recordKey": "name:法定福利費",
    "field": "name",
    "language": "en",
    "value": "Legal welfare expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:法定福利費",
    "field": "name",
    "language": "vi",
    "value": "Phúc lợi theo luật"
  },
  {
    "tableName": "Account",
    "recordKey": "name:消耗品費",
    "field": "name",
    "language": "en",
    "value": "Supplies expense"
  },
  {
    "tableName": "Account",
    "recordKey": "name:消耗品費",
    "field": "name",
    "language": "vi",
    "value": "CP vật liệu tiêu hao"
  },
  {
    "tableName": "Account",
    "recordKey": "name:減価償却費",
    "field": "name",
    "language": "en",
    "value": "Depreciation expense"
  },
  {
    "tableName": "Account",
    "recordKey": "name:減価償却費",
    "field": "name",
    "language": "vi",
    "value": "CP khấu hao"
  },
  {
    "tableName": "Account",
    "recordKey": "name:源泉所得税",
    "field": "name",
    "language": "en",
    "value": "Withholding income tax"
  },
  {
    "tableName": "Account",
    "recordKey": "name:源泉所得税",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNCN khấu trừ tại nguồn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:無形固定資産",
    "field": "name",
    "language": "en",
    "value": "Intangible fixed assets"
  },
  {
    "tableName": "Account",
    "recordKey": "name:無形固定資産",
    "field": "name",
    "language": "vi",
    "value": "TSCĐ vô hình"
  },
  {
    "tableName": "Account",
    "recordKey": "name:特別利益",
    "field": "name",
    "language": "en",
    "value": "Extraordinary gains"
  },
  {
    "tableName": "Account",
    "recordKey": "name:特別利益",
    "field": "name",
    "language": "vi",
    "value": "Lợi nhuận bất thường"
  },
  {
    "tableName": "Account",
    "recordKey": "name:特別損失",
    "field": "name",
    "language": "en",
    "value": "Extraordinary losses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:特別損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ bất thường"
  },
  {
    "tableName": "Account",
    "recordKey": "name:現金",
    "field": "name",
    "language": "en",
    "value": "Cash on hand"
  },
  {
    "tableName": "Account",
    "recordKey": "name:現金",
    "field": "name",
    "language": "vi",
    "value": "Tiền mặt"
  },
  {
    "tableName": "Account",
    "recordKey": "name:短期借入金",
    "field": "name",
    "language": "en",
    "value": "Short-term loans payable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:短期借入金",
    "field": "name",
    "language": "vi",
    "value": "Vay ngắn hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:短期貸付金",
    "field": "name",
    "language": "en",
    "value": "Short-term loans"
  },
  {
    "tableName": "Account",
    "recordKey": "name:短期貸付金",
    "field": "name",
    "language": "vi",
    "value": "Cho vay ngắn hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:福利厚生費",
    "field": "name",
    "language": "en",
    "value": "Employee welfare"
  },
  {
    "tableName": "Account",
    "recordKey": "name:福利厚生費",
    "field": "name",
    "language": "vi",
    "value": "Phúc lợi nhân viên"
  },
  {
    "tableName": "Account",
    "recordKey": "name:租税公課",
    "field": "name",
    "language": "en",
    "value": "Taxes and public charges"
  },
  {
    "tableName": "Account",
    "recordKey": "name:租税公課",
    "field": "name",
    "language": "vi",
    "value": "Thuế & phí công cộng"
  },
  {
    "tableName": "Account",
    "recordKey": "name:給料手当",
    "field": "name",
    "language": "en",
    "value": "Salaries and allowances"
  },
  {
    "tableName": "Account",
    "recordKey": "name:給料手当",
    "field": "name",
    "language": "vi",
    "value": "Tiền lương & phụ cấp"
  },
  {
    "tableName": "Account",
    "recordKey": "name:繰延資産",
    "field": "name",
    "language": "en",
    "value": "Deferred assets"
  },
  {
    "tableName": "Account",
    "recordKey": "name:繰延資産",
    "field": "name",
    "language": "vi",
    "value": "Tài sản dài hạn khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:繰越利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Retained earnings carried forward"
  },
  {
    "tableName": "Account",
    "recordKey": "name:繰越利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "LN giữ lại chuyển sang"
  },
  {
    "tableName": "Account",
    "recordKey": "name:自己株式",
    "field": "name",
    "language": "en",
    "value": "Treasury stock"
  },
  {
    "tableName": "Account",
    "recordKey": "name:自己株式",
    "field": "name",
    "language": "vi",
    "value": "Cổ phiếu quỹ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:荷造発送費",
    "field": "name",
    "language": "en",
    "value": "Packing and shipping"
  },
  {
    "tableName": "Account",
    "recordKey": "name:荷造発送費",
    "field": "name",
    "language": "vi",
    "value": "CP đóng gói vận chuyển"
  },
  {
    "tableName": "Account",
    "recordKey": "name:諸会費",
    "field": "name",
    "language": "en",
    "value": "Membership fees"
  },
  {
    "tableName": "Account",
    "recordKey": "name:諸会費",
    "field": "name",
    "language": "vi",
    "value": "Phí hội viên"
  },
  {
    "tableName": "Account",
    "recordKey": "name:販売費一般管理費",
    "field": "name",
    "language": "en",
    "value": "SG&A expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:販売費一般管理費",
    "field": "name",
    "language": "vi",
    "value": "CP bán hàng & quản lý"
  },
  {
    "tableName": "Account",
    "recordKey": "name:買掛金",
    "field": "name",
    "language": "en",
    "value": "Accounts payable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:買掛金",
    "field": "name",
    "language": "vi",
    "value": "Phải trả người bán"
  },
  {
    "tableName": "Account",
    "recordKey": "name:貸倒引当金",
    "field": "name",
    "language": "en",
    "value": "Allowance for doubtful accounts"
  },
  {
    "tableName": "Account",
    "recordKey": "name:貸倒引当金",
    "field": "name",
    "language": "vi",
    "value": "Dự phòng nợ khó đòi"
  },
  {
    "tableName": "Account",
    "recordKey": "name:貸倒損失",
    "field": "name",
    "language": "en",
    "value": "Bad debt loss"
  },
  {
    "tableName": "Account",
    "recordKey": "name:貸倒損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ do xóa nợ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本剰余金",
    "field": "name",
    "language": "en",
    "value": "Capital surplus"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本剰余金",
    "field": "name",
    "language": "vi",
    "value": "Thặng dư vốn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本準備金",
    "field": "name",
    "language": "en",
    "value": "Legal capital surplus"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本準備金",
    "field": "name",
    "language": "vi",
    "value": "Thặng dư vốn cổ phần"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本金",
    "field": "name",
    "language": "en",
    "value": "Capital stock"
  },
  {
    "tableName": "Account",
    "recordKey": "name:資本金",
    "field": "name",
    "language": "vi",
    "value": "Vốn điều lệ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:車両",
    "field": "name",
    "language": "en",
    "value": "Vehicles"
  },
  {
    "tableName": "Account",
    "recordKey": "name:車両",
    "field": "name",
    "language": "vi",
    "value": "Xe cộ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:車両運搬費",
    "field": "name",
    "language": "en",
    "value": "Vehicle transportation"
  },
  {
    "tableName": "Account",
    "recordKey": "name:車両運搬費",
    "field": "name",
    "language": "vi",
    "value": "CP vận chuyển xe cộ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:通信費",
    "field": "name",
    "language": "en",
    "value": "Communication expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:通信費",
    "field": "name",
    "language": "vi",
    "value": "CP viễn thông"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期借入金",
    "field": "name",
    "language": "en",
    "value": "Long-term loans payable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期借入金",
    "field": "name",
    "language": "vi",
    "value": "Vay dài hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期前払費用",
    "field": "name",
    "language": "en",
    "value": "Long-term prepaid expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期前払費用",
    "field": "name",
    "language": "vi",
    "value": "CP trả trước dài hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期貸付金",
    "field": "name",
    "language": "en",
    "value": "Long-term loans receivable"
  },
  {
    "tableName": "Account",
    "recordKey": "name:長期貸付金",
    "field": "name",
    "language": "vi",
    "value": "Cho vay dài hạn"
  },
  {
    "tableName": "Account",
    "recordKey": "name:開業費",
    "field": "name",
    "language": "en",
    "value": "Startup costs"
  },
  {
    "tableName": "Account",
    "recordKey": "name:開業費",
    "field": "name",
    "language": "vi",
    "value": "CP khởi nghiệp"
  },
  {
    "tableName": "Account",
    "recordKey": "name:開業費償却",
    "field": "name",
    "language": "en",
    "value": "Startup cost amortization"
  },
  {
    "tableName": "Account",
    "recordKey": "name:開業費償却",
    "field": "name",
    "language": "vi",
    "value": "Khấu hao CP khởi nghiệp"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雇用保険料",
    "field": "name",
    "language": "en",
    "value": "Employment insurance premium"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雇用保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm thất nghiệp"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑収入",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous income"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑収入",
    "field": "name",
    "language": "vi",
    "value": "Thu nhập khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑損失",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous loss"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ bất thường khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑費",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous expenses"
  },
  {
    "tableName": "Account",
    "recordKey": "name:雑費",
    "field": "name",
    "language": "vi",
    "value": "CP linh tinh khác"
  },
  {
    "tableName": "Account",
    "recordKey": "name:預り金",
    "field": "name",
    "language": "en",
    "value": "Deposits received"
  },
  {
    "tableName": "Account",
    "recordKey": "name:預り金",
    "field": "name",
    "language": "vi",
    "value": "Tiền giữ hộ"
  },
  {
    "tableName": "Account",
    "recordKey": "name:預金",
    "field": "name",
    "language": "en",
    "value": "Bank deposits"
  },
  {
    "tableName": "Account",
    "recordKey": "name:預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi NH"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "major:純資産",
    "field": "major",
    "language": "vi",
    "value": "Vốn chủ sở hữu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "major:経常損益",
    "field": "major",
    "language": "vi",
    "value": "Lãi/lỗ hoạt động"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "major:負債",
    "field": "major",
    "language": "vi",
    "value": "Nợ phải trả"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "major:資産",
    "field": "major",
    "language": "vi",
    "value": "Tài sản"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:事業主借",
    "field": "middle",
    "language": "vi",
    "value": "Chủ DN cho vay"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:事業主貸",
    "field": "middle",
    "language": "vi",
    "value": "Chủ DN vay"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:元入金",
    "field": "middle",
    "language": "vi",
    "value": "Vốn góp"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:営業外収益",
    "field": "middle",
    "language": "vi",
    "value": "Thu nhập ngoài HĐ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:営業外費用",
    "field": "middle",
    "language": "vi",
    "value": "Chi phí ngoài HĐ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:固定負債",
    "field": "middle",
    "language": "vi",
    "value": "Nợ dài hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:売上原価",
    "field": "middle",
    "language": "vi",
    "value": "Giá vốn hàng bán"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:売上高",
    "field": "middle",
    "language": "vi",
    "value": "Doanh thu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:投資等",
    "field": "middle",
    "language": "vi",
    "value": "Đầu tư"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:有形固定資産",
    "field": "middle",
    "language": "vi",
    "value": "TSCĐ hữu hình"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:株主資本",
    "field": "middle",
    "language": "vi",
    "value": "Vốn cổ đông"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:流動負債",
    "field": "middle",
    "language": "vi",
    "value": "Nợ ngắn hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:流動資産",
    "field": "middle",
    "language": "vi",
    "value": "Tài sản ngắn hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:無形固定資産",
    "field": "middle",
    "language": "vi",
    "value": "TSCĐ vô hình"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "middle:繰延資産",
    "field": "middle",
    "language": "vi",
    "value": "Tài sản dài hạn khác"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:その他利益剰余金",
    "field": "minor",
    "language": "vi",
    "value": "LN giữ lại khác"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:事業主借",
    "field": "minor",
    "language": "vi",
    "value": "Chủ DN cho vay"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:事業主貸",
    "field": "minor",
    "language": "vi",
    "value": "Chủ DN vay"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:仕入高",
    "field": "minor",
    "language": "vi",
    "value": "Mua vào"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:仕掛品",
    "field": "minor",
    "language": "vi",
    "value": "Sản phẩm dở dang"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:仮受消費税",
    "field": "minor",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm nhận"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:仮払消費税",
    "field": "minor",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm trả"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:仮払金",
    "field": "minor",
    "language": "vi",
    "value": "Tạm ứng"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:元入金",
    "field": "minor",
    "language": "vi",
    "value": "Vốn góp"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:利益剰余金",
    "field": "minor",
    "language": "vi",
    "value": "Lợi nhuận giữ lại"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:前受金",
    "field": "minor",
    "language": "vi",
    "value": "Doanh thu chưa thực hiện"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:前払い費用",
    "field": "minor",
    "language": "vi",
    "value": "Chi phí trả trước"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:前渡金",
    "field": "minor",
    "language": "vi",
    "value": "Tiền ứng trước"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:受取利息",
    "field": "minor",
    "language": "vi",
    "value": "Lãi tiền gửi"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:受取手形",
    "field": "minor",
    "language": "vi",
    "value": "Thương phiếu phải thu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:受取配当金",
    "field": "minor",
    "language": "vi",
    "value": "Cổ tức nhận được"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:商品",
    "field": "minor",
    "language": "vi",
    "value": "Hàng hóa"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:土地",
    "field": "minor",
    "language": "vi",
    "value": "Đất đai"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:売上高",
    "field": "minor",
    "language": "vi",
    "value": "Doanh thu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:売掛金",
    "field": "minor",
    "language": "vi",
    "value": "Phải thu khách hàng"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:外注費",
    "field": "minor",
    "language": "vi",
    "value": "Chi phí gia công ngoài"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:建物",
    "field": "minor",
    "language": "vi",
    "value": "Nhà cửa"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:投資等",
    "field": "minor",
    "language": "vi",
    "value": "Đầu tư"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:支払利息",
    "field": "minor",
    "language": "vi",
    "value": "Chi phí lãi vay"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:有価証券",
    "field": "minor",
    "language": "vi",
    "value": "Chứng khoán"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:未収入金",
    "field": "minor",
    "language": "vi",
    "value": "Thu nhập chưa thu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:未払い給与",
    "field": "minor",
    "language": "vi",
    "value": "Lương phải trả"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:未払法人税等",
    "field": "minor",
    "language": "vi",
    "value": "Thuế TNDN phải trả"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:未払消費税",
    "field": "minor",
    "language": "vi",
    "value": "Thuế tiêu dùng phải trả"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:未払金",
    "field": "minor",
    "language": "vi",
    "value": "Phải trả khác"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:材料",
    "field": "minor",
    "language": "vi",
    "value": "Nguyên vật liệu"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:棚卸高",
    "field": "minor",
    "language": "vi",
    "value": "Hàng tồn kho"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:法人税住民税等",
    "field": "minor",
    "language": "vi",
    "value": "Thuế TNDN & cư trú"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:無形固定資産",
    "field": "minor",
    "language": "vi",
    "value": "TSCĐ vô hình"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:特別利益",
    "field": "minor",
    "language": "vi",
    "value": "Lợi nhuận bất thường"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:特別損失",
    "field": "minor",
    "language": "vi",
    "value": "Lỗ bất thường"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:現金",
    "field": "minor",
    "language": "vi",
    "value": "Tiền mặt"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:短期借入金",
    "field": "minor",
    "language": "vi",
    "value": "Vay ngắn hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:短期貸付金",
    "field": "minor",
    "language": "vi",
    "value": "Cho vay ngắn hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:繰延資産",
    "field": "minor",
    "language": "vi",
    "value": "Tài sản dài hạn khác"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:自己株式",
    "field": "minor",
    "language": "vi",
    "value": "Cổ phiếu quỹ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:販売費一般管理費",
    "field": "minor",
    "language": "vi",
    "value": "CP bán hàng & quản lý"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:買掛金",
    "field": "minor",
    "language": "vi",
    "value": "Phải trả người bán"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:貸倒引当金",
    "field": "minor",
    "language": "vi",
    "value": "Dự phòng nợ khó đòi"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:資本剰余金",
    "field": "minor",
    "language": "vi",
    "value": "Thặng dư vốn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:資本金",
    "field": "minor",
    "language": "vi",
    "value": "Vốn điều lệ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:車両",
    "field": "minor",
    "language": "vi",
    "value": "Xe cộ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:長期借入金",
    "field": "minor",
    "language": "vi",
    "value": "Vay dài hạn"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:開業費償却",
    "field": "minor",
    "language": "vi",
    "value": "Khấu hao CP khởi nghiệp"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:雑収入",
    "field": "minor",
    "language": "vi",
    "value": "Thu nhập khác"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:預り金",
    "field": "minor",
    "language": "vi",
    "value": "Tiền giữ hộ"
  },
  {
    "tableName": "AccountClass",
    "recordKey": "minor:預金",
    "field": "minor",
    "language": "vi",
    "value": "Tiền gửi NH"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:国内外注",
    "field": "name",
    "language": "vi",
    "value": "Gia công nội địa"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:国内購買先",
    "field": "name",
    "language": "vi",
    "value": "Nhà cung cấp nội địa"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:国内顧客",
    "field": "name",
    "language": "vi",
    "value": "Khách hàng nội địa"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:海外外注",
    "field": "name",
    "language": "vi",
    "value": "Gia công nước ngoài"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:海外購買先",
    "field": "name",
    "language": "vi",
    "value": "Nhà cung cấp nước ngoài"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:海外顧客",
    "field": "name",
    "language": "vi",
    "value": "Khách hàng nước ngoài"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:税金公共料金等",
    "field": "name",
    "language": "vi",
    "value": "Thuế & phí công cộng"
  },
  {
    "tableName": "CompanyClass",
    "recordKey": "name:自社",
    "field": "name",
    "language": "vi",
    "value": "Công ty mình"
  },
  {
    "tableName": "ItemClass",
    "recordKey": "name:サービス(無形物)",
    "field": "name",
    "language": "vi",
    "value": "Dịch vụ (vô hình)"
  },
  {
    "tableName": "ItemClass",
    "recordKey": "name:商品(有形物)",
    "field": "name",
    "language": "vi",
    "value": "Hàng hóa (hữu hình)"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:アルバイト",
    "field": "title",
    "language": "vi",
    "value": "Nhân viên thời vụ"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:パートタイマ",
    "field": "title",
    "language": "vi",
    "value": "Nhân viên bán thời gian"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:常勤役員",
    "field": "title",
    "language": "vi",
    "value": "Thành viên HĐQT thường trực"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:常勤派遣",
    "field": "title",
    "language": "vi",
    "value": "Nhân viên phái cử thường trực"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:正社員",
    "field": "title",
    "language": "vi",
    "value": "Nhân viên chính thức"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:管理職",
    "field": "title",
    "language": "vi",
    "value": "Quản lý"
  },
  {
    "tableName": "MemberClass",
    "recordKey": "title:非常勤役員",
    "field": "title",
    "language": "vi",
    "value": "Thành viên HĐQT không thường trực"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:システム管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý hệ thống"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:パスワード変更",
    "field": "title",
    "language": "vi",
    "value": "Đổi mật khẩu"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:バックアップ",
    "field": "title",
    "language": "vi",
    "value": "Sao lưu"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:ホーム",
    "field": "title",
    "language": "vi",
    "value": "Trang chủ"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:人事管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý nhân sự"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:仕訳日記帳",
    "field": "title",
    "language": "vi",
    "value": "Sổ nhật ký"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:会計メニュー",
    "field": "title",
    "language": "vi",
    "value": "Menu kế toán"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:元帳",
    "field": "title",
    "language": "vi",
    "value": "Sổ cái"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:勘定科目管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý tài khoản"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:取引先種別",
    "field": "title",
    "language": "vi",
    "value": "Loại đối tác"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:取引先管理:国内購買先",
    "field": "title",
    "language": "vi",
    "value": "QL đối tác: NCC nội địa"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:取引先管理:国内顧客",
    "field": "title",
    "language": "vi",
    "value": "QL đối tác: KH nội địa"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:取引文書種別",
    "field": "title",
    "language": "vi",
    "value": "Loại chứng từ GD"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:取引管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý giao dịch"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:受取請求書",
    "field": "title",
    "language": "vi",
    "value": "Hóa đơn nhận"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:受取領収書",
    "field": "title",
    "language": "vi",
    "value": "Biên lai nhận"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:品目種別",
    "field": "title",
    "language": "vi",
    "value": "Loại mặt hàng"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:品目管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý mặt hàng"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:差出請求書",
    "field": "title",
    "language": "vi",
    "value": "Hóa đơn phát hành"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:差出領収書",
    "field": "title",
    "language": "vi",
    "value": "Biên lai phát hành"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:帳票出力",
    "field": "title",
    "language": "vi",
    "value": "Xuất báo cáo"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:年度選択",
    "field": "title",
    "language": "vi",
    "value": "Chọn niên độ"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:役職員管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý nhân viên"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:承認待ち",
    "field": "title",
    "language": "vi",
    "value": "Chờ phê duyệt"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:推移表",
    "field": "title",
    "language": "vi",
    "value": "Biểu đồ xu hướng"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:案件管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý dự án"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:残高試算表",
    "field": "title",
    "language": "vi",
    "value": "Bảng cân đối số dư"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:白紙のメニュー",
    "field": "title",
    "language": "vi",
    "value": "Menu trống"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:証憑種別",
    "field": "title",
    "language": "vi",
    "value": "Loại chứng từ"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:銀行元帳",
    "field": "title",
    "language": "vi",
    "value": "Sổ cái ngân hàng"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:顧客管理",
    "field": "title",
    "language": "vi",
    "value": "Quản lý khách hàng"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:顧客管理(国内)",
    "field": "title",
    "language": "vi",
    "value": "QL khách hàng (nội địa)"
  },
  {
    "tableName": "Menu",
    "recordKey": "title:顧客管理(海外)",
    "field": "title",
    "language": "vi",
    "value": "QL khách hàng (nước ngoài)"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:その他利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Other retained earnings"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:その他利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "LN giữ lại khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:ソフトウェア",
    "field": "name",
    "language": "en",
    "value": "Software"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:ソフトウェア",
    "field": "name",
    "language": "vi",
    "value": "Phần mềm"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:事業主借",
    "field": "name",
    "language": "en",
    "value": "Owner contributions"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:事業主借",
    "field": "name",
    "language": "vi",
    "value": "Chủ DN cho vay"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:事業主貸",
    "field": "name",
    "language": "en",
    "value": "Owner draws"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:事業主貸",
    "field": "name",
    "language": "vi",
    "value": "Chủ DN vay"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:介護保険料",
    "field": "name",
    "language": "en",
    "value": "Long-term care insurance premium"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:介護保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm chăm sóc dài hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仕入高",
    "field": "name",
    "language": "en",
    "value": "Purchases"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仕入高",
    "field": "name",
    "language": "vi",
    "value": "Mua vào"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仕掛品",
    "field": "name",
    "language": "en",
    "value": "Work in process"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仕掛品",
    "field": "name",
    "language": "vi",
    "value": "Sản phẩm dở dang"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮受消費税",
    "field": "name",
    "language": "en",
    "value": "Temporary consumption tax received"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮受消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm nhận"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮払消費税",
    "field": "name",
    "language": "en",
    "value": "Temporary consumption tax paid"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮払消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng tạm trả"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮払金",
    "field": "name",
    "language": "en",
    "value": "Temporary payments"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:仮払金",
    "field": "name",
    "language": "vi",
    "value": "Tạm ứng"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:住民税",
    "field": "name",
    "language": "en",
    "value": "Resident tax"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:住民税",
    "field": "name",
    "language": "vi",
    "value": "Thuế cư trú"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:保険料",
    "field": "name",
    "language": "en",
    "value": "Insurance premium"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:健康保険料",
    "field": "name",
    "language": "en",
    "value": "Health insurance premium"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:健康保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm y tế"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:元入金",
    "field": "name",
    "language": "en",
    "value": "Owner equity"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:元入金",
    "field": "name",
    "language": "vi",
    "value": "Vốn góp"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:出資金",
    "field": "name",
    "language": "en",
    "value": "Investment in capital"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:出資金",
    "field": "name",
    "language": "vi",
    "value": "Góp vốn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Retained earnings"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "Lợi nhuận giữ lại"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:利益準備金",
    "field": "name",
    "language": "en",
    "value": "Legal earned reserve"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:利益準備金",
    "field": "name",
    "language": "vi",
    "value": "Quỹ dự phòng lợi nhuận"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前受金",
    "field": "name",
    "language": "en",
    "value": "Unearned revenue"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前受金",
    "field": "name",
    "language": "vi",
    "value": "Doanh thu chưa thực hiện"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前払い費用",
    "field": "name",
    "language": "en",
    "value": "Prepaid expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前払い費用",
    "field": "name",
    "language": "vi",
    "value": "Chi phí trả trước"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前渡金",
    "field": "name",
    "language": "en",
    "value": "Advances paid"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:前渡金",
    "field": "name",
    "language": "vi",
    "value": "Tiền ứng trước"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:創立費",
    "field": "name",
    "language": "en",
    "value": "Organization costs"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:創立費",
    "field": "name",
    "language": "vi",
    "value": "CP thành lập"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:厚生年金保険料",
    "field": "name",
    "language": "en",
    "value": "Employees' pension insurance premium"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:厚生年金保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm lương hưu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:原材料",
    "field": "name",
    "language": "en",
    "value": "Raw materials"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:原材料",
    "field": "name",
    "language": "vi",
    "value": "Nguyên liệu thô"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取利息",
    "field": "name",
    "language": "en",
    "value": "Interest income"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取利息",
    "field": "name",
    "language": "vi",
    "value": "Lãi tiền gửi"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取手形",
    "field": "name",
    "language": "en",
    "value": "Notes receivable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取手形",
    "field": "name",
    "language": "vi",
    "value": "Thương phiếu phải thu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取配当金",
    "field": "name",
    "language": "en",
    "value": "Dividend income"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:受取配当金",
    "field": "name",
    "language": "vi",
    "value": "Cổ tức nhận được"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:商品",
    "field": "name",
    "language": "en",
    "value": "Merchandise"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:商品",
    "field": "name",
    "language": "vi",
    "value": "Hàng hóa"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:商標権",
    "field": "name",
    "language": "en",
    "value": "Trademark rights"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:商標権",
    "field": "name",
    "language": "vi",
    "value": "Quyền nhãn hiệu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:営業権",
    "field": "name",
    "language": "en",
    "value": "Goodwill"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:営業権",
    "field": "name",
    "language": "vi",
    "value": "Uy tín thương mại"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:土地",
    "field": "name",
    "language": "en",
    "value": "Land"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:土地",
    "field": "name",
    "language": "vi",
    "value": "Đất đai"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:地代家賃",
    "field": "name",
    "language": "en",
    "value": "Rent expense"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:地代家賃",
    "field": "name",
    "language": "vi",
    "value": "Tiền thuê nhà đất"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:報酬料金",
    "field": "name",
    "language": "en",
    "value": "Fees and commissions"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:報酬料金",
    "field": "name",
    "language": "vi",
    "value": "Phí hoa hồng"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売上返金",
    "field": "name",
    "language": "en",
    "value": "Sales returns"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売上返金",
    "field": "name",
    "language": "vi",
    "value": "Hoàn trả doanh thu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売上高",
    "field": "name",
    "language": "en",
    "value": "Sales"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売上高",
    "field": "name",
    "language": "vi",
    "value": "Doanh thu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売掛金",
    "field": "name",
    "language": "en",
    "value": "Accounts receivable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:売掛金",
    "field": "name",
    "language": "vi",
    "value": "Phải thu khách hàng"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:外注費",
    "field": "name",
    "language": "en",
    "value": "Outsourcing expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:外注費",
    "field": "name",
    "language": "vi",
    "value": "Chi phí gia công ngoài"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:定期積立",
    "field": "name",
    "language": "en",
    "value": "Periodic savings"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:定期積立",
    "field": "name",
    "language": "vi",
    "value": "Tích lũy định kỳ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:定期預金",
    "field": "name",
    "language": "en",
    "value": "Time deposits"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:定期預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi có kỳ hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:差入保証金",
    "field": "name",
    "language": "en",
    "value": "Guarantee deposits paid"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:差入保証金",
    "field": "name",
    "language": "vi",
    "value": "Đặt cọc ký quỹ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:広告宣伝費",
    "field": "name",
    "language": "en",
    "value": "Advertising expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:広告宣伝費",
    "field": "name",
    "language": "vi",
    "value": "CP quảng cáo & tuyên truyền"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:建物",
    "field": "name",
    "language": "en",
    "value": "Buildings"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:建物",
    "field": "name",
    "language": "vi",
    "value": "Nhà cửa"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:当座預金",
    "field": "name",
    "language": "en",
    "value": "Checking deposits"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:当座預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi thanh toán"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:役員報酬",
    "field": "name",
    "language": "en",
    "value": "Directors compensation"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:役員報酬",
    "field": "name",
    "language": "vi",
    "value": "Thù lao cán bộ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:投資有価証券",
    "field": "name",
    "language": "en",
    "value": "Investment securities"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:投資有価証券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán đầu tư"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:投資等",
    "field": "name",
    "language": "en",
    "value": "Investments"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:投資等",
    "field": "name",
    "language": "vi",
    "value": "Đầu tư"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:支払利息",
    "field": "name",
    "language": "en",
    "value": "Interest expense"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:支払利息",
    "field": "name",
    "language": "vi",
    "value": "Chi phí lãi vay"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:支払手数料",
    "field": "name",
    "language": "en",
    "value": "Bank transaction fees"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:支払手数料",
    "field": "name",
    "language": "vi",
    "value": "Phí giao dịch"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:敷金",
    "field": "name",
    "language": "en",
    "value": "Lease deposits"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:敷金",
    "field": "name",
    "language": "vi",
    "value": "Tiền đặt cọc"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:旅費交通費",
    "field": "name",
    "language": "en",
    "value": "Travel and transportation"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:旅費交通費",
    "field": "name",
    "language": "vi",
    "value": "CP đi lại"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:普通預金",
    "field": "name",
    "language": "en",
    "value": "Ordinary deposits"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:普通預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi không kỳ hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:有価証券",
    "field": "name",
    "language": "en",
    "value": "Securities"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:有価証券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:有価證券",
    "field": "name",
    "language": "en",
    "value": "Securities (traditional)"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:有価證券",
    "field": "name",
    "language": "vi",
    "value": "Chứng khoán (chữ Hán cổ)"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:期末商品棚卸高",
    "field": "name",
    "language": "en",
    "value": "Ending merchandise inventory"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:期末商品棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Tồn kho cuối kỳ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:期首商品棚卸高",
    "field": "name",
    "language": "en",
    "value": "Beginning merchandise inventory"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:期首商品棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Tồn kho đầu kỳ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未収入金",
    "field": "name",
    "language": "en",
    "value": "Accrued income"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未収入金",
    "field": "name",
    "language": "vi",
    "value": "Thu nhập chưa thu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払い給与",
    "field": "name",
    "language": "en",
    "value": "Accrued salaries"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払い給与",
    "field": "name",
    "language": "vi",
    "value": "Lương phải trả"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払法人税等",
    "field": "name",
    "language": "en",
    "value": "Income tax payable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払法人税等",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNDN phải trả"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払消費税",
    "field": "name",
    "language": "en",
    "value": "Consumption tax payable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払消費税",
    "field": "name",
    "language": "vi",
    "value": "Thuế tiêu dùng phải trả"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払金",
    "field": "name",
    "language": "en",
    "value": "Accrued expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:未払金",
    "field": "name",
    "language": "vi",
    "value": "Phải trả khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:材料",
    "field": "name",
    "language": "en",
    "value": "Raw materials"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:材料",
    "field": "name",
    "language": "vi",
    "value": "Nguyên vật liệu"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:棚卸高",
    "field": "name",
    "language": "en",
    "value": "Inventory"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:棚卸高",
    "field": "name",
    "language": "vi",
    "value": "Hàng tồn kho"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:水道光熱費",
    "field": "name",
    "language": "en",
    "value": "Utilities"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:水道光熱費",
    "field": "name",
    "language": "vi",
    "value": "CP điện nước"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:法人税住民税等",
    "field": "name",
    "language": "en",
    "value": "Income & residence tax"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:法人税住民税等",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNDN & cư trú"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:法定福利費",
    "field": "name",
    "language": "en",
    "value": "Legal welfare expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:法定福利費",
    "field": "name",
    "language": "vi",
    "value": "Phúc lợi theo luật"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:消耗品費",
    "field": "name",
    "language": "en",
    "value": "Supplies expense"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:消耗品費",
    "field": "name",
    "language": "vi",
    "value": "CP vật liệu tiêu hao"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:減価償却費",
    "field": "name",
    "language": "en",
    "value": "Depreciation expense"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:減価償却費",
    "field": "name",
    "language": "vi",
    "value": "CP khấu hao"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:源泉所得税",
    "field": "name",
    "language": "en",
    "value": "Withholding income tax"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:源泉所得税",
    "field": "name",
    "language": "vi",
    "value": "Thuế TNCN khấu trừ tại nguồn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:無形固定資産",
    "field": "name",
    "language": "en",
    "value": "Intangible fixed assets"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:無形固定資産",
    "field": "name",
    "language": "vi",
    "value": "TSCĐ vô hình"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:特別利益",
    "field": "name",
    "language": "en",
    "value": "Extraordinary gains"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:特別利益",
    "field": "name",
    "language": "vi",
    "value": "Lợi nhuận bất thường"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:特別損失",
    "field": "name",
    "language": "en",
    "value": "Extraordinary losses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:特別損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ bất thường"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:現金",
    "field": "name",
    "language": "en",
    "value": "Cash on hand"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:現金",
    "field": "name",
    "language": "vi",
    "value": "Tiền mặt"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:短期借入金",
    "field": "name",
    "language": "en",
    "value": "Short-term loans payable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:短期借入金",
    "field": "name",
    "language": "vi",
    "value": "Vay ngắn hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:短期貸付金",
    "field": "name",
    "language": "en",
    "value": "Short-term loans"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:短期貸付金",
    "field": "name",
    "language": "vi",
    "value": "Cho vay ngắn hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:福利厚生費",
    "field": "name",
    "language": "en",
    "value": "Employee welfare"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:福利厚生費",
    "field": "name",
    "language": "vi",
    "value": "Phúc lợi nhân viên"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:租税公課",
    "field": "name",
    "language": "en",
    "value": "Taxes and public charges"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:租税公課",
    "field": "name",
    "language": "vi",
    "value": "Thuế & phí công cộng"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:給料手当",
    "field": "name",
    "language": "en",
    "value": "Salaries and allowances"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:給料手当",
    "field": "name",
    "language": "vi",
    "value": "Tiền lương & phụ cấp"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:繰延資産",
    "field": "name",
    "language": "en",
    "value": "Deferred assets"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:繰延資産",
    "field": "name",
    "language": "vi",
    "value": "Tài sản dài hạn khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:繰越利益剰余金",
    "field": "name",
    "language": "en",
    "value": "Retained earnings carried forward"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:繰越利益剰余金",
    "field": "name",
    "language": "vi",
    "value": "LN giữ lại chuyển sang"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:自己株式",
    "field": "name",
    "language": "en",
    "value": "Treasury stock"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:自己株式",
    "field": "name",
    "language": "vi",
    "value": "Cổ phiếu quỹ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:荷造発送費",
    "field": "name",
    "language": "en",
    "value": "Packing and shipping"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:荷造発送費",
    "field": "name",
    "language": "vi",
    "value": "CP đóng gói vận chuyển"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:諸会費",
    "field": "name",
    "language": "en",
    "value": "Membership fees"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:諸会費",
    "field": "name",
    "language": "vi",
    "value": "Phí hội viên"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:販売費一般管理費",
    "field": "name",
    "language": "en",
    "value": "SG&A expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:販売費一般管理費",
    "field": "name",
    "language": "vi",
    "value": "CP bán hàng & quản lý"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:買掛金",
    "field": "name",
    "language": "en",
    "value": "Accounts payable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:買掛金",
    "field": "name",
    "language": "vi",
    "value": "Phải trả người bán"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:貸倒引当金",
    "field": "name",
    "language": "en",
    "value": "Allowance for doubtful accounts"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:貸倒引当金",
    "field": "name",
    "language": "vi",
    "value": "Dự phòng nợ khó đòi"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:貸倒損失",
    "field": "name",
    "language": "en",
    "value": "Bad debt loss"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:貸倒損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ do xóa nợ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本剰余金",
    "field": "name",
    "language": "en",
    "value": "Capital surplus"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本剰余金",
    "field": "name",
    "language": "vi",
    "value": "Thặng dư vốn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本準備金",
    "field": "name",
    "language": "en",
    "value": "Legal capital surplus"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本準備金",
    "field": "name",
    "language": "vi",
    "value": "Thặng dư vốn cổ phần"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本金",
    "field": "name",
    "language": "en",
    "value": "Capital stock"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:資本金",
    "field": "name",
    "language": "vi",
    "value": "Vốn điều lệ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:車両",
    "field": "name",
    "language": "en",
    "value": "Vehicles"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:車両",
    "field": "name",
    "language": "vi",
    "value": "Xe cộ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:車両運搬費",
    "field": "name",
    "language": "en",
    "value": "Vehicle transportation"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:車両運搬費",
    "field": "name",
    "language": "vi",
    "value": "CP vận chuyển xe cộ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:通信費",
    "field": "name",
    "language": "en",
    "value": "Communication expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:通信費",
    "field": "name",
    "language": "vi",
    "value": "CP viễn thông"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期借入金",
    "field": "name",
    "language": "en",
    "value": "Long-term loans payable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期借入金",
    "field": "name",
    "language": "vi",
    "value": "Vay dài hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期前払費用",
    "field": "name",
    "language": "en",
    "value": "Long-term prepaid expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期前払費用",
    "field": "name",
    "language": "vi",
    "value": "CP trả trước dài hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期貸付金",
    "field": "name",
    "language": "en",
    "value": "Long-term loans receivable"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:長期貸付金",
    "field": "name",
    "language": "vi",
    "value": "Cho vay dài hạn"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:開業費",
    "field": "name",
    "language": "en",
    "value": "Startup costs"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:開業費",
    "field": "name",
    "language": "vi",
    "value": "CP khởi nghiệp"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:開業費償却",
    "field": "name",
    "language": "en",
    "value": "Startup cost amortization"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:開業費償却",
    "field": "name",
    "language": "vi",
    "value": "Khấu hao CP khởi nghiệp"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雇用保険料",
    "field": "name",
    "language": "en",
    "value": "Employment insurance premium"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雇用保険料",
    "field": "name",
    "language": "vi",
    "value": "Phí bảo hiểm thất nghiệp"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑収入",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous income"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑収入",
    "field": "name",
    "language": "vi",
    "value": "Thu nhập khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑損失",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous loss"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑損失",
    "field": "name",
    "language": "vi",
    "value": "Lỗ bất thường khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑費",
    "field": "name",
    "language": "en",
    "value": "Miscellaneous expenses"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:雑費",
    "field": "name",
    "language": "vi",
    "value": "CP linh tinh khác"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:預り金",
    "field": "name",
    "language": "en",
    "value": "Deposits received"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:預り金",
    "field": "name",
    "language": "vi",
    "value": "Tiền giữ hộ"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:預金",
    "field": "name",
    "language": "en",
    "value": "Bank deposits"
  },
  {
    "tableName": "SubAccount",
    "recordKey": "name:預金",
    "field": "name",
    "language": "vi",
    "value": "Tiền gửi NH"
  },
  {
    "tableName": "TaxRule",
    "recordKey": "label:内税 10%",
    "field": "label",
    "language": "vi",
    "value": "Thuế gồm trong giá 10%"
  },
  {
    "tableName": "TaxRule",
    "recordKey": "label:内税 軽減(8%)",
    "field": "label",
    "language": "vi",
    "value": "Thuế gồm trong giá ưu đãi (8%)"
  },
  {
    "tableName": "TaxRule",
    "recordKey": "label:外税 10%",
    "field": "label",
    "language": "vi",
    "value": "Thuế ngoài giá 10%"
  },
  {
    "tableName": "TaxRule",
    "recordKey": "label:外税 軽減(8%)",
    "field": "label",
    "language": "vi",
    "value": "Thuế ngoài giá ưu đãi (8%)"
  },
  {
    "tableName": "TaxRule",
    "recordKey": "label:非課税",
    "field": "label",
    "language": "vi",
    "value": "Không chịu thuế"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:報告書",
    "field": "label",
    "language": "vi",
    "value": "Báo cáo"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:注文請書",
    "field": "label",
    "language": "vi",
    "value": "Xác nhận đơn hàng"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:納品",
    "field": "label",
    "language": "vi",
    "value": "Giao hàng"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:見積",
    "field": "label",
    "language": "vi",
    "value": "Báo giá"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:請求",
    "field": "label",
    "language": "vi",
    "value": "Yêu cầu thanh toán"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:議事録",
    "field": "label",
    "language": "vi",
    "value": "Biên bản họp"
  },
  {
    "tableName": "TransactionKind",
    "recordKey": "label:領収",
    "field": "label",
    "language": "vi",
    "value": "Biên lai"
  },
  {
    "tableName": "VoucherClass",
    "recordKey": "name:受取請求書",
    "field": "name",
    "language": "vi",
    "value": "Hóa đơn nhận"
  },
  {
    "tableName": "VoucherClass",
    "recordKey": "name:受取領収書",
    "field": "name",
    "language": "vi",
    "value": "Biên lai nhận"
  },
  {
    "tableName": "VoucherClass",
    "recordKey": "name:差出見積書",
    "field": "name",
    "language": "vi",
    "value": "Báo giá phát hành"
  },
  {
    "tableName": "VoucherClass",
    "recordKey": "name:差出請求書",
    "field": "name",
    "language": "vi",
    "value": "Hóa đơn phát hành"
  },
  {
    "tableName": "VoucherClass",
    "recordKey": "name:差出領収書",
    "field": "name",
    "language": "vi",
    "value": "Biên lai phát hành"
  }
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const records = SYSTEM_TRANSLATIONS.map(row => ({
      tableName: row.tableName,
      recordKey: row.recordKey,
      field: row.field,
      language: row.language,
      value: row.value,
      tenantId: null,
      createdAt: now,
      updatedAt: now
    }));

    // Batch insert with ON CONFLICT DO NOTHING on system partial unique index
    await queryInterface.sequelize.transaction(async (t) => {
      // Chunk into batches of 100 to stay well within Postgres parameter limits
      const chunkSize = 100;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const valuePlaceholders = chunk.map((_, idx) => {
          const base = idx * 8;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
        }).join(',\n');

        const params = [];
        for (const r of chunk) {
          params.push(r.tableName, r.recordKey, r.field, r.language, r.value, r.tenantId, r.createdAt, r.updatedAt);
        }

        const sql = `
          INSERT INTO "Translations" ("tableName", "recordKey", "field", "language", "value", "tenantId", "createdAt", "updatedAt")
          VALUES ${valuePlaceholders}
          ON CONFLICT ("tableName", "recordKey", "field", "language") WHERE "tenantId" IS NULL DO NOTHING;
        `;

        await queryInterface.sequelize.query(sql, {
          bind: params,
          transaction: t
        });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Delete specifically the system translation tuples managed by this seed
      const chunkSize = 100;
      for (let i = 0; i < SYSTEM_TRANSLATIONS.length; i += chunkSize) {
        const chunk = SYSTEM_TRANSLATIONS.slice(i, i + chunkSize);
        const conditions = chunk.map((_, idx) => {
          const base = idx * 4;
          return `("tableName" = $${base + 1} AND "recordKey" = $${base + 2} AND "field" = $${base + 3} AND "language" = $${base + 4} AND "tenantId" IS NULL)`;
        }).join(' OR\n  ');

        const params = [];
        for (const r of chunk) {
          params.push(r.tableName, r.recordKey, r.field, r.language);
        }

        const sql = `
          DELETE FROM "Translations"
          WHERE ${conditions};
        `;

        await queryInterface.sequelize.query(sql, {
          bind: params,
          transaction: t
        });
      }
    });
  }
};
