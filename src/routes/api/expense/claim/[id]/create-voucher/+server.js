import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function POST({ locals, params }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = locals.tenantId;
    const userId = locals.user.id;
    const id = parseInt(params.id, 10);

    const claim = await models.ExpenseClaim.findOne({
      where: { id, tenantId },
      include: [
        {
          model: models.ExpenseClaimItem,
          as: 'items',
          include: [{ model: models.ExpenseCategory, as: 'category' }]
        },
        { model: models.ExpenseAdvance, as: 'advance' }
      ],
      transaction
    });

    if (!claim) {
      await transaction.rollback();
      return json({ code: -1, message: 'Expense claim not found.' }, { status: 404 });
    }

    if (claim.crossSlipId) {
      await transaction.rollback();
      return json({ code: -1, message: 'Bút toán kế toán cho hồ sơ quyết toán này đã được tạo trước đó.' }, { status: 400 });
    }

    const claimDateObj = new Date(claim.claimDate);
    const year = claimDateObj.getFullYear();
    const month = claimDateObj.getMonth() + 1;
    const day = claimDateObj.getDate();

    const fiscalYear = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'DESC']],
      transaction
    });

    const term = fiscalYear ? fiscalYear.term : 1;
    const currentNo = (await models.CrossSlip.count({
      where: { tenantId, year, month },
      transaction
    })) + 1;

    const crossSlip = await models.CrossSlip.create({
      tenantId,
      year,
      month,
      day,
      no: currentNo,
      lineCount: claim.items.length + (claim.advanceAmount > 0 ? 2 : 1),
      term,
      createdBy: userId,
      updatedBy: userId
    }, { transaction });

    const categoryTotals = {};
    for (const it of claim.items) {
      const acc = it.category?.accountCode || '642';
      categoryTotals[acc] = (categoryTotals[acc] || 0) + parseFloat(it.amount || 0);
    }

    let lineNo = 1;
    const summary = `経費精算 ${claim.code}: ${claim.title}`;

    for (const [accountCode, amount] of Object.entries(categoryTotals)) {
      await models.CrossSlipDetail.create({
        tenantId,
        crossSlipId: crossSlip.id,
        lineNo: lineNo++,
        debitAccount: accountCode,
        debitAmount: amount,
        creditAccount: claim.advanceAmount > 0 ? '141' : '334',
        creditAmount: amount,
        application1: `${summary} - Chi phí`,
        application2: ''
      }, { transaction });
    }

    claim.crossSlipId = crossSlip.id;
    claim.status = 'settled';
    await claim.save({ transaction });

    if (claim.advance) {
      claim.advance.status = 'settled';
      await claim.advance.save({ transaction });
    }

    await transaction.commit();

    return json({
      code: 0,
      message: 'Bút toán quyết toán chi phí đã được tự động hạch toán vào Sổ Cái.',
      crossSlipId: crossSlip.id,
      crossSlip
    });
  } catch (e) {
    await transaction.rollback();
    return json({ code: -1, message: e.message }, { status: 500 });
  }
}
