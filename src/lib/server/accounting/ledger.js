import models from '../../../../models/index.js';
const Op = models.Sequelize.Op;

export const getAccountLedger = async (tenantId, term, accountCode, subAccountCode) => {
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
  if (!fy) return { details: [], summary: { debitSum: 0, creditSum: 0, balance: 0 } };

  const account = await models.Account.findOne({
    where: {
      tenantId,
      [Op.or]: [
        { accountCode: accountCode.toString() },
        { id: isNaN(accountCode) ? 0 : parseInt(accountCode, 10) }
      ]
    }
  });

  if (!account) return { details: [], summary: { debitSum: 0, creditSum: 0, balance: 0 } };

  const accountKeys = [account.accountCode, account.id.toString()];

  let whereDetail = {
    tenantId,
    [Op.or]: [
      { debitAccount: { [Op.in]: accountKeys } },
      { creditAccount: { [Op.in]: accountKeys } }
    ]
  };

  if (subAccountCode) {
    const subAccount = await models.SubAccount.findOne({
      where: {
        tenantId,
        accountId: account.id,
        subAccountCode: subAccountCode.toString()
      }
    });
    if (subAccount) {
      whereDetail = {
        tenantId,
        [Op.or]: [
          { debitAccount: { [Op.in]: accountKeys }, debitSubAccount: subAccount.id },
          { creditAccount: { [Op.in]: accountKeys }, creditSubAccount: subAccount.id }
        ]
      };
    }
  }

  const details = await models.CrossSlipDetail.findAll({
    where: whereDetail,
    include: [
      {
        model: models.CrossSlip,
        as: 'crossSlip',
        where: { tenantId, term },
        required: true
      }
    ],
    order: [
      [{ model: models.CrossSlip, as: 'crossSlip' }, 'year', 'ASC'],
      [{ model: models.CrossSlip, as: 'crossSlip' }, 'month', 'ASC'],
      [{ model: models.CrossSlip, as: 'crossSlip' }, 'day', 'ASC'],
      ['lineNo', 'ASC']
    ]
  });

  let debitSum = 0;
  let creditSum = 0;

  const lines = details.map((d) => {
    const isDebit = accountKeys.includes(d.debitAccount);
    const debit = isDebit ? parseFloat(d.debitAmount) : 0;
    const credit = !isDebit ? parseFloat(d.creditAmount) : 0;
    debitSum += debit;
    creditSum += credit;

    return {
      id: d.id,
      slipId: d.crossSlipId,
      slipNo: d.crossSlip.no,
      date: `${d.crossSlip.year}-${String(d.crossSlip.month).padStart(2, '0')}-${String(d.crossSlip.day).padStart(2, '0')}`,
      application: d.application1 || d.application2 || '',
      debitAmount: debit,
      creditAmount: credit
    };
  });

  return {
    account: {
      id: account.id,
      name: account.name,
      code: account.accountCode
    },
    lines,
    summary: {
      debitSum,
      creditSum,
      balance: debitSum - creditSum
    }
  };
};
