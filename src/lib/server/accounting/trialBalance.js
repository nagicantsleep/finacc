import models from '../../../../models/index.js';

export const calculateTrialBalance = async (tenantId, term) => {
  const accounts = await models.Account.findAll({
    where: { tenantId },
    include: [
      { model: models.AccountClass, as: 'accountClass' }
    ],
    order: [['accountCode', 'ASC']]
  });

  const details = await models.CrossSlipDetail.findAll({
    where: { tenantId },
    include: [
      {
        model: models.CrossSlip,
        as: 'crossSlip',
        where: { tenantId, term },
        required: true
      }
    ]
  });

  const debitMap = {};
  const creditMap = {};

  details.forEach((d) => {
    if (d.debitAccount) {
      debitMap[d.debitAccount] = (debitMap[d.debitAccount] || 0) + parseFloat(d.debitAmount || 0);
    }
    if (d.creditAccount) {
      creditMap[d.creditAccount] = (creditMap[d.creditAccount] || 0) + parseFloat(d.creditAmount || 0);
    }
  });

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = accounts.map((acc) => {
    const code = acc.accountCode;
    const idStr = acc.id.toString();

    const debit = (debitMap[code] || 0) + (debitMap[idStr] || 0);
    const credit = (creditMap[code] || 0) + (creditMap[idStr] || 0);
    const balance = debit - credit;

    totalDebit += debit;
    totalCredit += credit;

    return {
      id: acc.id,
      code: acc.accountCode,
      name: acc.name,
      category: acc.accountClass?.major || 'その他',
      debit,
      credit,
      balance
    };
  });

  return {
    rows,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.001
    }
  };
};
