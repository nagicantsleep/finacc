import models from '$lib/server/db/index.js';
import { numeric } from '$lib/utils.js';

const Op = models.Sequelize.Op;

export async function getMonthlyChanges(fy, account, subAccount, tenantId) {
  const changes = [];
  let startDate;
  let endDate;
  if (fy) {
    startDate = new Date(fy.startDate);
    endDate = new Date(fy.endDate);
  } else {
    const first = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'ASC']]
    });
    const last = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'DESC']]
    });
    startDate = new Date(first.startDate);
    endDate = new Date(last.endDate);
  }

  const sub = subAccount != null && subAccount !== '' ? parseInt(subAccount, 10) : 0;
  const acc = account;

  for (let mon = startDate; mon <= endDate; mon.setMonth(mon.getMonth() + 1)) {
    let where;
    if (sub > 0) {
      where = {
        [Op.and]: {
          [Op.or]: [
            { debitAccount: acc, debitSubAccount: sub },
            { creditAccount: acc, creditSubAccount: sub }
          ],
          '$crossSlip.year$': mon.getFullYear(),
          '$crossSlip.month$': mon.getMonth() + 1,
          '$crossSlip.approvedAt$': { [Op.ne]: null }
        }
      };
    } else {
      where = {
        [Op.and]: {
          '$crossSlip.year$': mon.getFullYear(),
          '$crossSlip.month$': mon.getMonth() + 1,
          '$crossSlip.approvedAt$': { [Op.ne]: null },
          [Op.or]: {
            debitAccount: acc,
            creditAccount: acc
          }
        }
      };
    }

    const details = await models.CrossSlipDetail.findAll({
      where: { ...where, tenantId },
      include: [{
        model: models.CrossSlip,
        as: 'crossSlip',
        where: { tenantId },
        required: false
      }],
      order: [
        models.sequelize.literal('"crossSlip"."year", "crossSlip"."month", "crossSlip"."day", "crossSlip"."no", "CrossSlipDetail"."lineNo" ASC')
      ]
    });

    const change = {
      year: mon.getFullYear(),
      month: mon.getMonth() + 1,
      debitAmount: 0,
      debitTax: 0,
      creditAmount: 0,
      creditTax: 0
    };
    for (let i = 0; i < details.length; i++) {
      if (sub > 0) {
        if (String(details[i].debitAccount) === String(acc) && details[i].debitSubAccount === sub) {
          change.debitAmount += numeric(details[i].debitAmount);
          change.debitTax += numeric(details[i].debitTax);
        }
        if (String(details[i].creditAccount) === String(acc) && details[i].creditSubAccount === sub) {
          change.creditAmount += numeric(details[i].creditAmount);
          change.creditTax += numeric(details[i].creditTax);
        }
      } else {
        if (String(details[i].debitAccount) === String(acc)) {
          change.debitAmount += numeric(details[i].debitAmount);
          change.debitTax += numeric(details[i].debitTax);
        }
        if (String(details[i].creditAccount) === String(acc)) {
          change.creditAmount += numeric(details[i].creditAmount);
          change.creditTax += numeric(details[i].creditTax);
        }
      }
    }
    changes.push(change);
  }
  return changes;
}

export async function getChanges(tenantId, termParam, account, subAccount) {
  const term = parseInt(termParam, 10);
  if (term > 0) {
    const fy = await models.FiscalYear.findOne({ where: { term, tenantId } });
    return getMonthlyChanges(fy, account, subAccount, tenantId);
  }
  return getMonthlyChanges(undefined, account, subAccount, tenantId);
}
