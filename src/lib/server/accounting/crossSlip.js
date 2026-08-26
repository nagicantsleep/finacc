import models from '../db/index.js';
const Op = models.Sequelize.Op;

export const createCrossSlipDetail = async (line, slipId, lineNo, tenantId, t) => {
  return models.CrossSlipDetail.create(
    {
      tenantId,
      crossSlipId: slipId,
      lineNo: lineNo,
      debitAccount: line.debitAccount?.toString(),
      debitSubAccount: line.debitSubAccount ? parseInt(line.debitSubAccount, 10) : null,
      debitAmount: line.debitAmount || 0,
      debitTax: line.debitTax || 0,
      debitVoucherId: line.debitVoucherId || null,
      debitTaxRuleId: line.debitTaxRuleId || null,
      creditAccount: line.creditAccount?.toString(),
      creditSubAccount: line.creditSubAccount ? parseInt(line.creditSubAccount, 10) : null,
      creditAmount: line.creditAmount || 0,
      creditTax: line.creditTax || 0,
      creditVoucherId: line.creditVoucherId || null,
      creditTaxRuleId: line.creditTaxRuleId || null,
      projectId: line.projectId || null,
      application1: line.application1 || '',
      application2: line.application2 || ''
    },
    { transaction: t }
  );
};

export const createCrossSlip = async (body, user, tenantId) => {
  const t = await models.sequelize.transaction();
  try {
    const year = parseInt(body.year, 10);
    const month = parseInt(body.month, 10);
    const day = parseInt(body.day, 10);

    const slipDate = new Date(year, month - 1, day);

    const fy = await models.FiscalYear.findOne({
      where: {
        tenantId,
        startDate: { [Op.lte]: slipDate },
        endDate: { [Op.gte]: slipDate }
      },
      transaction: t
    });

    if (!fy) {
      throw new Error('指定された日付の会計年度（FiscalYear）が見つかりません。');
    }

    let ml = await models.MonthlyLog.findOne({
      where: { tenantId, term: fy.term, month },
      transaction: t
    });

    if (!ml) {
      ml = await models.MonthlyLog.create(
        {
          tenantId,
          term: fy.term,
          month,
          slipCount: 0,
          voucharCount: 0
        },
        { transaction: t }
      );
    }
    ml.slipCount += 1;
    await ml.save({ transaction: t });

    const slip = await models.CrossSlip.create(
      {
        tenantId,
        term: fy.term,
        no: ml.slipCount,
        year,
        month,
        day,
        createdBy: user.id,
        approvedAt: user.approvable ? new Date() : null,
        approvedBy: user.approvable ? user.id : null
      },
      { transaction: t }
    );

    if (Array.isArray(body.lines)) {
      for (let i = 0; i < body.lines.length; i++) {
        await createCrossSlipDetail(body.lines[i], slip.id, i + 1, tenantId, t);
      }
    }

    await t.commit();
    return slip;
  } catch (e) {
    if (!t.finished) await t.rollback();
    throw e;
  }
};
