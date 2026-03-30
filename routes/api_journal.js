import models from '../models/index.js';
const Op = models.Sequelize.Op;

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let year =  parseInt(req.params.year);
    let month =  parseInt(req.params.month);
    
    let cross_slips = [];

    let slips = await models.CrossSlip.findAll({
      where: {
        [Op.and]: {
          tenantId,
          year: year,
          month: month
        }
      },
      include: [{
          model: models.User,
          as: 'creater'
        }, {
          model: models.User,
          as: 'approver'
        }
      ],
      order: [
        [ 'year', 'ASC'],
        [ 'month', 'ASC'],
        [ 'day', 'ASC' ],
        [ 'no', 'ASC' ]
      ]
    });
    //console.log('slips', slips);

    for ( let i = 0; i < slips.length; i ++ ) {
      let slip = slips[i];
      let details = await models.CrossSlipDetail.findAll({
        where: {
          crossSlipId: slip.id,
          tenantId: tenantId
        },
        include: [
          {
            model: models.Voucher,
            required: false,
            as: 'debitVoucher',
            where: { tenantId },
            include: [{
              model: models.VoucherFile,
              as: 'files',
              where: { tenantId },
              required: false
            }]
          }, {
            model: models.Voucher,
            required: false,
            as: 'creditVoucher',
            where: { tenantId },
            include: [{
              model: models.VoucherFile,
              as: 'files',
              where: { tenantId },
              required: false
            }]
          }, {
            model: models.TaxRule,
            as: 'debitTaxRule',
            where: { tenantId },
            required: false
          }, {
            model: models.TaxRule,
            as: 'creditTaxRule',
            where: { tenantId },
            required: false
          }, {
            model: models.Project,
            as: 'projectData',
            where: { tenantId },
            required: false
          }
        ],
          order: [
          ['lineNo', 'ASC' ]
        ]
      });
      let lines = [];
      for ( let j = 0; j < details.length; j ++ ) {
        let detail = details[j];
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
        lines: lines
      });
    }
    //console.log(JSON.stringify(cross_slips, ' ', 2));
    res.json({
      journal: cross_slips
    });
  },
};
