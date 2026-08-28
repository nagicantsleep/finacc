import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
const Op = models.Sequelize.Op;

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  let year = parseInt(params.year, 10);
  let month = parseInt(params.month, 10);
  if (isNaN(year) || isNaN(month)) {
    const now = new Date();
    year = isNaN(year) ? now.getFullYear() : year;
    month = isNaN(month) ? (now.getMonth() + 1) : month;
  }

  const tenantId = locals.tenantId;
  const cross_slips = [];

  const slips = await models.CrossSlip.findAll({
    where: {
      tenantId,
      year,
      month
    },
    include: [
      {
        model: models.User,
        as: 'creater'
      },
      {
        model: models.User,
        as: 'approver'
      }
    ],
    order: [
      ['year', 'ASC'],
      ['month', 'ASC'],
      ['day', 'ASC'],
      ['no', 'ASC']
    ]
  });

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

    const lines = [];
    for (let j = 0; j < details.length; j++) {
      const detail = details[j];
      lines.push({
        id: detail.id,
        lineNo: detail.lineNo,
        debitAmount: detail.debitAmount,
        debitTax: detail.debitTax,
        debitTaxRule: detail.debitTaxRule,
        debitTaxRuleId: detail.debitTaxRuleId,

        debitAccount: detail.debitAccount,
        debitSubAccount: detail.debitSubAccount,
        debitVoucherId: detail.debitVoucherId,
        debitVoucher: detail.debitVoucher,

        application1: detail.application1,
        application2: detail.application2,

        creditAmount: detail.creditAmount,
        creditTax: detail.creditTax,
        creditTaxRule: detail.creditTaxRule,
        creditTaxRuleId: detail.creditTaxRuleId,
        creditVoucherId: detail.creditVoucherId,
        creditVoucher: detail.creditVoucher,

        projectId: detail.projectId,
        projectData: detail.projectData,

        creditAccount: detail.creditAccount,
        creditSubAccount: detail.creditSubAccount
      });
    }

    cross_slips.push({
      id: slip.id,
      year: slip.year,
      month: slip.month,
      day: slip.day,
      no: slip.no,
      term: slip.term,
      createrName: slip.creater ? slip.creater.name : '',
      approverName: slip.approver ? slip.approver.name : '',
      approvedAt: slip.approvedAt,
      lines
    });
  }

  return json({
    result: 'OK',
    journal: cross_slips
  });
}
