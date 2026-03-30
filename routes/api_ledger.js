import models from '../models/index.js';
const Op = models.Sequelize.Op;
import Accounts from '../libs/accounts.js';

const	get_details = async (fy, account, sub_account, tenantId) => {
  //console.log({account});
  //console.log({sub_account});
  let ledger = [];
  const endDate = new Date(fy.endDate);
  for ( let mon = new Date(fy.startDate); mon <= endDate; mon.setMonth(mon.getMonth() + 1) ) {
    let where;

    if (( sub_account ) &&
      ( sub_account > 0 )) {
      where = {
        [Op.and]: {
          [Op.or]: [
            {
              debitAccount: account,
              debitSubAccount: sub_account
            },
            {
              creditAccount: account,
              creditSubAccount: sub_account
            }
          ],
          '$crossSlip.year$': mon.getFullYear(),
          '$crossSlip.month$': mon.getMonth() + 1
        }
      };
    } else {
      where = {
          [Op.and]: {
            '$crossSlip.year$': mon.getFullYear(),
            '$crossSlip.month$': mon.getMonth() + 1,
            [Op.or]: {
              debitAccount: account,
              creditAccount: account
            }
          }
        };
    }
    //console.log('where', where);

    let details = await models.CrossSlipDetail.findAll({
      where: { ...where, tenantId },
      include: [
        {
          model: models.CrossSlip,
          as: 'crossSlip',
          where: { tenantId },
          required: false
        },
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
        },
        {
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
        models.sequelize.literal('"crossSlip"."year", "crossSlip"."month", "crossSlip"."day", "crossSlip"."no", "CrossSlipDetail"."lineNo" ASC')
      ]
    });
    for ( let i = 0; i < details.length; i ++ ) {
      if  ( details[i].crossSlip.approvedAt ) {
        ledger.push(details[i]);
      }
    }
  }
  return	(ledger)
}

export default {
  get: (req, res, next) => {
    const tenantId = req.currentTenantId;
    let term =  parseInt(req.params.term);
    let account = req.params.account;
    let sub_account = parseInt(req.params.sub_account);
    models.FiscalYear.findOne({
      where: {
        tenantId,
        term: term
      }
    }).then((fy) => {
      get_details(fy, account, sub_account, tenantId).then((ledger)=> {
        res.json(ledger);
      })
    });
  },
};
