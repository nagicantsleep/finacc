import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

function mapDetail(detail) {
  return {
    id: detail.id,
    lineNo: detail.lineNo,
    debitAmount: detail.debitAmount,
    debitTax: detail.debitTax,
    debitTaxRule: asJson(detail.debitTaxRule),
    debitTaxRuleId: detail.debitTaxRuleId,
    debitAccount: detail.debitAccount,
    debitSubAccount: detail.debitSubAccount,
    debitVoucherId: detail.debitVoucherId,
    debitVoucher: asJson(detail.debitVoucher),
    application1: detail.application1,
    application2: detail.application2,
    creditAmount: detail.creditAmount,
    creditTax: detail.creditTax,
    creditTaxRule: asJson(detail.creditTaxRule),
    creditTaxRuleId: detail.creditTaxRuleId,
    creditVoucherId: detail.creditVoucherId,
    creditVoucher: asJson(detail.creditVoucher),
    projectId: detail.projectId,
    projectData: asJson(detail.projectData),
    creditAccount: detail.creditAccount,
    creditSubAccount: detail.creditSubAccount
  };
}

export function fiscalMonthRange(startDate, endDate) {
  const dates = [];
  if (!startDate || !endDate) return dates;
  const end = new Date(endDate);
  for (let mon = new Date(startDate); mon <= end; ) {
    dates.push({
      year: mon.getFullYear(),
      month: mon.getMonth() + 1
    });
    mon.setMonth(mon.getMonth() + 1);
  }
  return dates;
}

export async function getJournalMonth(tenantId, year, month) {
  const slips = await models.CrossSlip.findAll({
    where: {
      tenantId,
      year,
      month
    },
    include: [
      { model: models.User, as: 'creater' },
      { model: models.User, as: 'approver' }
    ],
    order: [
      ['year', 'ASC'],
      ['month', 'ASC'],
      ['day', 'ASC'],
      ['no', 'ASC']
    ]
  });

  const journal = [];

  for (let i = 0; i < slips.length; i++) {
    const slip = slips[i];
    const details = await models.CrossSlipDetail.findAll({
      where: {
        crossSlipId: slip.id,
        tenantId
      },
      include: [
        {
          model: models.Voucher,
          required: false,
          as: 'debitVoucher',
          where: { tenantId },
          include: [
            {
              model: models.VoucherFile,
              as: 'files',
              where: { tenantId },
              required: false
            }
          ]
        },
        {
          model: models.Voucher,
          required: false,
          as: 'creditVoucher',
          where: { tenantId },
          include: [
            {
              model: models.VoucherFile,
              as: 'files',
              where: { tenantId },
              required: false
            }
          ]
        },
        {
          model: models.TaxRule,
          as: 'debitTaxRule',
          where: { tenantId },
          required: false
        },
        {
          model: models.TaxRule,
          as: 'creditTaxRule',
          where: { tenantId },
          required: false
        },
        {
          model: models.Project,
          as: 'projectData',
          where: { tenantId },
          required: false
        }
      ],
      order: [['lineNo', 'ASC']]
    });

    journal.push({
      id: slip.id,
      year: slip.year,
      month: slip.month,
      day: slip.day,
      no: slip.no,
      term: slip.term,
      createrName: slip.creater ? slip.creater.name : '',
      approverName: slip.approver ? slip.approver.name : '',
      approvedAt: slip.approvedAt ? slip.approvedAt.toISOString() : null,
      lines: details.map(mapDetail)
    });
  }

  return journal;
}
