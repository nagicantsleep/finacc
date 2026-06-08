/**
 * Simulated P/L Report — Issue #270 (E3.9).
 *
 * Groups scenario entries by month, classifying accounts as revenue or expense
 * via AccountClass. Returns { months: [{ month, revenue, expense, netIncome }] }.
 */

import models from '../../models/index.js';
import { getScenario } from './scenario-service.js';

/**
 * Monthly P/L for a simulation scenario.
 *
 * The function loads all entries (manual + generated) for the scenario and
 * classifies each entry's debit/credit account using AccountClass.
 *
 * Revenue accounts: AccountClass.major = '収益' (or middle = '営業収益' etc.)
 * Expense accounts: AccountClass.major = '費用'
 *
 * For each entry, the credit side counts toward revenue and the debit side
 * counts toward expense (simplified: we look at which account is revenue/expense).
 */
export async function simulatedPL(tenantId, scenarioId, periodFrom, periodTo) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const effectiveFrom = periodFrom || scenario.simPeriodFrom;
  const effectiveTo = periodTo || scenario.simPeriodTo;

  // Load all entries in range
  const entries = await models.SimulationEntry.findAll({
    where: {
      tenantId,
      scenarioId,
      date: {
        [models.Sequelize.Op.between]: [effectiveFrom, effectiveTo],
      },
    },
    order: [['date', 'ASC']],
  });

  // Collect unique account codes mentioned in entries
  const accountCodes = [...new Set([
    ...entries.map(e => e.debitAccount),
    ...entries.map(e => e.creditAccount),
  ])];

  // Fetch Account with AccountClass for classification
  const accountClassMap = {};
  if (accountCodes.length > 0) {
    const accRows = await models.Account.findAll({
      where: {
        tenantId,
        accountCode: { [models.Sequelize.Op.in]: accountCodes },
      },
      include: [{ model: models.AccountClass, as: 'accountClass' }],
    });
    for (const acc of accRows) {
      accountClassMap[acc.accountCode] = acc.accountClass;
    }
  }

  // Monthly buckets: YYYY-MM
  const monthMap = {};

  for (const e of entries) {
    const month = typeof e.date === 'string'
      ? e.date.substring(0, 7)
      : e.date.toISOString().substring(0, 7);

    if (!monthMap[month]) {
      monthMap[month] = { month, revenue: 0, expense: 0 };
    }

    const m = monthMap[month];

    // Credit side → potential revenue
    const creditAc = accountClassMap[e.creditAccount];
    if (creditAc && creditAc.major === '収益') {
      m.revenue += Number(e.creditAmount);
    }

    // Debit side → potential expense
    const debitAc = accountClassMap[e.debitAccount];
    if (debitAc && debitAc.major === '費用') {
      m.expense += Number(e.debitAmount);
    }
  }

  // Sort months, compute net income
  const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  for (const m of months) {
    m.netIncome = m.revenue - m.expense;
  }

  return { months, count: months.length, periodFrom: effectiveFrom, periodTo: effectiveTo };
}
