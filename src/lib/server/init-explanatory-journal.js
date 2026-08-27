import {numeric, burstPage } from './utils.js';
import {setAccounts, findAccount, findSubAccountByCode} from '../front/javascripts/cross-slip.js';
import Accounts from './accounts.js';

let fy = {};
let dates;

const LINES = 24;

const setupDates = async (term, tenantId) => {
  const { default: models } = await import('../models/index.js');
  const Op = models.Sequelize.Op;
  
  fy = await models.FiscalYear.findOne({
    where: { term, tenantId }
  });
  
  dates = [];
  for ( let mon = new Date(fy.startDate); mon < new Date(fy.endDate); ) {
    let year = mon.getFullYear();
    let month = mon.getMonth() + 1;
    
    let slips = await models.CrossSlip.findAll({
      where: {
        tenantId,
        year: year,
        month: month
      },
      include: [{
        model: models.User,
        as: 'creater'
      }, {
        model: models.User,
        as: 'approver'
      }],
      order: [
        ['year', 'ASC'],
        ['month', 'ASC'],
        ['day', 'ASC'],
        ['no', 'ASC']
      ]
    });

    let cross_slips = [];
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
          ['lineNo', 'ASC']
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
    
    const ret = ready(cross_slips);

    let pages = burstPage(ret.lines, LINES);
    dates.push({
      year: year,
      month: month,
      pages: pages,
      sums: ret.sums
    });
    mon.setMonth(mon.getMonth() + 1);
  }
}

const setupAccount = async (tenantId) => {
  let accounts = await Accounts.all(tenantId);
  setAccounts(accounts);
}
const ready = (slips) => {
  let _lines = [];
  let _sums = {
    debitAmount: 0,
    debitTax: 0,
    creditAmount: 0,
    creditTax: 0
  }
  for ( let i = 0; i < slips.length; i ++ ) {
    let slip = slips[i];
    if  ( !slip.approvedAt )  break;
    slip.approvedAt = new Date(slip.approvedAt);
    for ( let j = 0; j < slip.lines.length; j ++ ) {
      let line = slip.lines[j];
      let debitTax = line.debitTax ? numeric(line.debitTax) : 0
      let creditTax = line.creditTax ? numeric(line.creditTax) : 0

      _sums.debitAmount += line.debitAmount ? numeric(line.debitAmount) : 0;
      _sums.debitTax += debitTax;
      _sums.creditAmount += line.creditAmount ? numeric(line.creditAmount) : 0;
      _sums.creditTax += creditTax;

      _lines.push({
        id: line.id,
        month: slip.month,
        day: slip.day,
        no: slip.no,
        approvedAt: slip.approvedAt,
        lineNo: line.lineNo,

        debitAmount: line.debitAmount,
        debitTax: debitTax,
        debitTaxRule: line.debitTaxRule,
        creditAmount: line.creditAmount,
        creditTax: creditTax,
        creditTaxRule: line.creditTaxRule,
           
        debitAccount: findAccount(line.debitAccount).name,
        debitSubAccount: findSubAccountByCode(line.debitAccount, line.debitSubAccount).name,

        creditAccount: findAccount(line.creditAccount).name,
        creditSubAccount: findSubAccountByCode(line.creditAccount, line.creditSubAccount).name,

        debitVoucher: line.debitVoucher,
        debitVoucherId: line.debitVoucherId,
        creditVoucher: line.creditVoucher,
        creditVoucherId: line.creditVoucherId,

        application1: line.application1 || '',
        application2: line.application2 || ''
      });
    }
  }
  return	({
    lines:_lines,
  	sums:_sums
  });
}

export default async (term, tenantId) => {
  await setupAccount(tenantId);  
  await setupDates(term, tenantId);
  return  ({
    fy: fy,
    dates: dates
  });
}