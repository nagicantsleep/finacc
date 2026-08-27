/**
 * Cash Projection — Issue #269 (E3.8).
 *
 * Monthly cash flow from scenario entries. Account classification via
 * AccountClass.middle = '現金及び預金' identifies cash accounts.
 *
 * Returns [{ month, openingCash, cashIn, cashOut, netFlow, endingCash, accrualProfit }].
 */

import models from '../../models/index.js';
import { getScenario } from './scenario-service.js';

const CASH_MIDDLE = '現金及び預金';

function ym(dateStr) {
  return typeof dateStr === 'string' ? dateStr.substring(0, 7) : dateStr.toISOString().substring(0, 7);
}

function addMonths(ymStr, n) {
  const [y, m] = ymStr.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

function monthKeys(from, to) {
  const keys = [];
  let cursor = from.substring(0, 7);
  const endKey = to.substring(0, 7);
  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return keys;
}

export async function cashProjection(tenantId, scenarioId, periodFrom, periodTo) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const effectiveFrom = periodFrom || scenario.simPeriodFrom;
  const effectiveTo = periodTo || scenario.simPeriodTo;

  const entries = await models.SimulationEntry.findAll({
    where: {
      tenantId,
      scenarioId,
      date: { [models.Sequelize.Op.between]: [effectiveFrom, effectiveTo] },
    },
    order: [['date', 'ASC']],
  });

  // Classify accounts → build cash account set
  const accountCodes = [...new Set([
    ...entries.map(e => e.debitAccount),
    ...entries.map(e => e.creditAccount),
  ])];

  const cashCodes = new Set();
  const classMap = {}; // accountCode → AccountClass

  if (accountCodes.length > 0) {
    const accRows = await models.Account.findAll({
      where: { tenantId, accountCode: { [models.Sequelize.Op.in]: accountCodes } },
      include: [{ model: models.AccountClass, as: 'accountClass' }],
    });
    for (const acc of accRows) {
      if (acc.accountClass) {
        classMap[acc.accountCode] = acc.accountClass;
        if (acc.accountClass.middle === CASH_MIDDLE)
          cashCodes.add(acc.accountCode);
      }
    }
  }

  // Opening cash: sum prior entries touching cash accounts
  const priorEntries = await models.SimulationEntry.findAll({
    where: {
      tenantId, scenarioId,
      date: { [models.Sequelize.Op.lt]: effectiveFrom },
    },
  });

  let openingCash = 0;
  for (const e of priorEntries) {
    if (cashCodes.has(e.debitAccount)) openingCash += Number(e.debitAmount);
    if (cashCodes.has(e.creditAccount)) openingCash -= Number(e.creditAmount);
  }

  // Build monthly projection
  const keys = monthKeys(effectiveFrom, effectiveTo);
  const months = [];
  let runningCash = openingCash;

  for (const mk of keys) {
    let cashIn = 0, cashOut = 0;
    let revenue = 0, expense = 0;

    for (const e of entries) {
      if (ym(e.date) !== mk) continue;

      const dIsCash = cashCodes.has(e.debitAccount);
      const cIsCash = cashCodes.has(e.creditAccount);

      if (dIsCash && !cIsCash) cashIn += Number(e.debitAmount);
      if (cIsCash && !dIsCash) cashOut += Number(e.creditAmount);

      const dCls = classMap[e.debitAccount];
      const cCls = classMap[e.creditAccount];
      if (dCls && dCls.major === '費用') expense += Number(e.debitAmount);
      if (cCls && cCls.major === '収益') revenue += Number(e.creditAmount);
    }

    const netFlow = cashIn - cashOut;
    runningCash += netFlow;

    months.push({
      month: mk,
      openingCash: runningCash - netFlow,
      cashIn, cashOut, netFlow,
      endingCash: runningCash,
      accrualProfit: revenue - expense,
    });
  }

  return { months, openingCash, periodFrom: effectiveFrom, periodTo: effectiveTo };
}
