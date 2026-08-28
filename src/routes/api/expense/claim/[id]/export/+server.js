import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals, params }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const id = parseInt(params.id, 10);

  const claim = await models.ExpenseClaim.findOne({
    where: { id, tenantId },
    include: [
      { model: models.User, as: 'user' },
      { model: models.ExpenseClaimItem, as: 'items', include: [{ model: models.ExpenseCategory, as: 'category' }, { model: models.Company, as: 'company' }] }
    ]
  });

  if (!claim) {
    return json({ code: -1, message: 'Expense claim not found.' }, { status: 404 });
  }

  const header = ['STT', 'Ngày', 'Hạng mục chi phí', 'Mô tả / Nội dung', 'Đối tác / Nhà cung cấp', 'Số tiền', 'Thuế'];
  const rows = claim.items.map((it, idx) => [
    idx + 1,
    it.date,
    it.category?.name || 'Chi phí',
    it.description,
    it.company?.name || '-',
    it.amount,
    it.taxAmount || 0
  ]);

  rows.push(['', '', '', 'TỔNG CHI PHÍ', '', claim.totalAmount, '']);
  rows.push(['', '', '', 'ĐÃ TẠM ỨNG', '', `-${claim.advanceAmount}`, '']);
  rows.push(['', '', '', 'THỰC NHẬN HOÀN ỨNG', '', claim.netAmount, '']);

  const csvContent = [
    header.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  return new Response('\uFEFF' + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="expense-claim-${claim.code}-${Date.now()}.csv"`
    }
  });
}
