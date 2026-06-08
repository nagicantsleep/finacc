/**
 * Assumption generator — Issue #264 (E3.3), #265 (E3.4), #266 (E3.5).
 *
 * Generates SimulationEntry[] from assumptions — never writes to DB.
 * Preview + Regenerate call these pure generator functions.
 */

/**
 * Yield the actual day of month to use, clamping to the last calendar day.
 * e.g. dayOfMonth=31, month=2 → clamp to 28 or 29 (leap year aware).
 */
function effectiveDay(year, month, dayOfMonth) {
  const last = new Date(year, month, 0).getDate(); // month is 1-based here, so day 0 = last day of prev month
  return Math.min(dayOfMonth, last);
}

function toDateStr(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function maxDate(a, b) {
  // a and b are 'YYYY-MM-DD'
  return a > b ? a : b;
}

function minDate(a, b) {
  return a < b ? a : b;
}

/**
 * Generate simulation entries from a recurring assumption.
 *
 * @param {object} assumption — row from SimulationAssumption (with .parameters)
 * @param {object} scenario   — SimulationScenario row (gives simPeriodFrom, simPeriodTo)
 * @returns {object[]} Array of plain entry objects (not persisted)
 */
export function generateRecurringEntries(assumption, scenario) {
  const p = assumption.parameters;
  const frequency = p.frequency; // 'monthly' | 'quarterly' | 'yearly'
  const dayOfMonth = p.dayOfMonth || 1;

  // Date range: start = max(assumption.startMonth, scenario.simPeriodFrom)
  //             end   = min(assumption.endMonth or scenario.simPeriodTo, scenario.simPeriodTo)
  const startDate = maxDate(assumption.startMonth, scenario.simPeriodFrom);
  const endDate = minDate(assumption.endMonth || scenario.simPeriodTo, scenario.simPeriodTo);

  const entries = [];

  let baseAmount = p.amount;
  if (!baseAmount || baseAmount <= 0) return entries;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1; // 1-based

  const months = [];
  let y = startYear;
  let m = startMonth;

  if (frequency === 'monthly') {
    const totalMonths = (end.getFullYear() - startYear) * 12 + (end.getMonth() + 1) - startMonth + 1;
    for (let i = 0; i < totalMonths; i++) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (frequency === 'quarterly') {
    // Anchor to start month; then step by 3
    while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth() + 1)) {
      months.push({ year: y, month: m });
      m += 3;
      if (m > 12) { m -= 12; y++; }
    }
  } else if (frequency === 'yearly') {
    months.push({ year: startYear, month: startMonth });
    // If the end year is later, add subsequent years (same month)
    for (let cy = startYear + 1; cy <= end.getFullYear(); cy++) {
      if (cy === end.getFullYear() && startMonth > end.getMonth() + 1) break;
      months.push({ year: cy, month: startMonth });
    }
  }

  const increaseRule = p.increaseRule; // { type: 'percent'|'fixed', value }

  for (let i = 0; i < months.length; i++) {
    const { year, month } = months[i];
    const day = effectiveDay(year, month, dayOfMonth);
    const dateStr = toDateStr(year, month, day);

    // Must be within [startDate, endDate]
    if (dateStr < startDate || dateStr > endDate) continue;

    // Compute amount with increase rule (applied after first entry)
    let amount = baseAmount;
    if (i > 0 && increaseRule) {
      if (increaseRule.type === 'percent') {
        amount = baseAmount * Math.pow(1 + increaseRule.value / 100, i);
      } else if (increaseRule.type === 'fixed') {
        amount = baseAmount + increaseRule.value * i;
      }
    }
    // Round to integer yen (PostgreSQL DECIMAL(12) has scale 0)
    amount = Math.round(amount);

    entries.push({
      date: dateStr,
      debitAccount: p.debitAccount,
      debitSubAccount: p.debitSubAccount || null,
      debitAmount: amount,
      creditAccount: p.creditAccount,
      creditSubAccount: p.creditSubAccount || null,
      creditAmount: amount,
      taxRuleId: p.taxRuleId || null,
      projectId: p.projectId || null,
      labelId: p.labelId || null,
      memo: p.memo || `${assumption.name} (${dateStr})`,
      sourceType: 'recurring',
    });
  }

  return entries;
}

/**
 * Generate simulation entries from a revenue_growth assumption.
 *
 * growthValue semantics by growthType:
 *   percent  — base amount (month 1), compounded by .growthRate % each month
 *   fixed    — base amount (month 1), + .increment each subsequent month
 *   manual   — array of amounts per month
 *   avg_last_3m — uses average of last 3 priorRevenues (growthValue ignored)
 *   last_month  — uses last priorRevenue (growthValue ignored)
 *
 * @param {object}  assumption
 * @param {object}  scenario
 * @param {number[]} priorRevenues — previous months' revenue (needed for avg/prev based growth)
 * @returns {object[]} entries
 */
export function generateRevenueGrowthEntries(assumption, scenario, priorRevenues = []) {
  const p = assumption.parameters;
  const { growthType, growthValue, revenueAccount, counterAccount } = p;
  const timingDays = p.collectionTimingDays || 0;

  const startDate = maxDate(assumption.startMonth, scenario.simPeriodFrom);
  const endDate = minDate(assumption.endMonth || scenario.simPeriodTo, scenario.simPeriodTo);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const baseY = start.getFullYear();
  const baseM = start.getMonth() + 1;

  let totalMonths =
    (end.getFullYear() - baseY) * 12 + (end.getMonth() + 1) - baseM + 1;
  if (totalMonths < 0) return [];

  const entries = [];

  for (let i = 0; i < totalMonths; i++) {
    let y = baseY, m = baseM + i;
    while (m > 12) { m -= 12; y++; }
    const dateStr = toDateStr(y, m, 1);
    if (dateStr < startDate || dateStr > endDate) continue;

    let amount;
    switch (growthType) {
      case 'percent':
        // growthValue = base; .growthRate = percentage per month
        amount = growthValue * Math.pow(1 + (p.growthRate || 0) / 100, i);
        amount = Math.round(amount);
        break;
      case 'fixed':
        // growthValue = base; .increment = addition per month
        amount = (growthValue || 0) + (p.increment || 0) * i;
        break;
      case 'manual':
        amount = Array.isArray(growthValue) ? (growthValue[i] || 0) : 0;
        break;
      case 'avg_last_3m': {
        const slice = priorRevenues.slice(-3);
        amount = slice.length > 0
          ? Math.round(slice.reduce((s, v) => s + v, 0) / slice.length)
          : 0;
        break;
      }
      case 'last_month':
        amount = priorRevenues.length > 0 ? priorRevenues[priorRevenues.length - 1] : 0;
        break;
      default:
        amount = growthValue || 0;
    }

    if (!amount || amount <= 0) continue;

    // Accrual entry — revenue recognition on the month
    entries.push({
      date: dateStr,
      debitAccount: counterAccount,
      debitSubAccount: null,
      debitAmount: amount,
      creditAccount: revenueAccount,
      creditSubAccount: null,
      creditAmount: amount,
      taxRuleId: p.taxRuleId || null,
      projectId: p.projectId || null,
      labelId: null,
      memo: `${assumption.name} (revenue ${dateStr})`,
      sourceType: 'formula',
    });

    // Cash collection entry with timing offset
    if (timingDays > 0) {
      const cashDate = addDays(dateStr, timingDays);
      if (cashDate >= startDate && cashDate <= endDate) {
        entries.push({
          date: cashDate,
          debitAccount: '1000',       // cash
          debitSubAccount: null,
          debitAmount: amount,
          creditAccount: counterAccount,
          creditSubAccount: null,
          creditAmount: amount,
          taxRuleId: null,
          projectId: null,
          labelId: null,
          memo: `${assumption.name} (collection ${cashDate})`,
          sourceType: 'formula',
        });
      }
    }
  }

  return entries;
}

function addDays(dateStr, days) {
  if (!days) return dateStr;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate simulation entries from an expense_fixed assumption.
 *
 * amountType semantics:
 *   fixed            — .amount each month
 *   percent_of_sales — .percentOf * salesPerMonth
 *   headcount        — 1 assumption → 2 entries per month (salary + insurance)
 *
 * Headcount: salary entry = count × salaryPerMonth
 *            insurance entry = count × salaryPerMonth × insurancePct / 100
 *
 * Payment timing shifts the cash entry by .paymentTimingDays days.
 *
 * @param {object}   assumption
 * @param {object}   scenario
 * @param {number[]} salesPerMonth — monthly sales (needed for percent_of_sales type)
 * @returns {object[]} entries
 */
export function generateExpenseFixedEntries(assumption, scenario, salesPerMonth = []) {
  const p = assumption.parameters;
  const { expenseAccount, counterAccount, amountType } = p;
  const timingDays = p.paymentTimingDays || 0;

  const startDate = maxDate(assumption.startMonth, scenario.simPeriodFrom);
  const endDate = minDate(assumption.endMonth || scenario.simPeriodTo, scenario.simPeriodTo);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const baseY = start.getFullYear();
  const baseM = start.getMonth() + 1;

  let totalMonths =
    (end.getFullYear() - baseY) * 12 + (end.getMonth() + 1) - baseM + 1;
  if (totalMonths < 0) return [];

  const entries = [];

  for (let i = 0; i < totalMonths; i++) {
    let y = baseY, m = baseM + i;
    while (m > 12) { m -= 12; y++; }
    const dateStr = toDateStr(y, m, 1);
    if (dateStr < startDate || dateStr > endDate) continue;

    let amount;
    switch (amountType) {
      case 'fixed':
        amount = p.amount || 0;
        break;
      case 'percent_of_sales':
        amount = Math.round((salesPerMonth[i] || 0) * (p.percentOfValue || 0) / 100);
        break;
      case 'headcount':
        if (p.headcount) {
          const h = p.headcount;
          const salaryAmount = Math.round(h.count * h.salaryPerMonth);
          const insuranceAmount = Math.round(salaryAmount * h.insurancePct / 100);

          // Salary accrual
          entries.push({
            date: dateStr,
            debitAccount: h.salaryAccount,
            debitSubAccount: null,
            debitAmount: salaryAmount,
            creditAccount: counterAccount,
            creditSubAccount: null,
            creditAmount: salaryAmount,
            taxRuleId: p.taxRuleId || null,
            projectId: p.projectId || null,
            labelId: null,
            memo: `${assumption.name} (salary ${dateStr})`,
            sourceType: 'formula',
          });

          // Insurance accrual
          entries.push({
            date: dateStr,
            debitAccount: h.insuranceAccount,
            debitSubAccount: null,
            debitAmount: insuranceAmount,
            creditAccount: counterAccount,
            creditSubAccount: null,
            creditAmount: insuranceAmount,
            taxRuleId: p.taxRuleId || null,
            projectId: p.projectId || null,
            labelId: null,
            memo: `${assumption.name} (insurance ${dateStr})`,
            sourceType: 'formula',
          });

          // Cash payment (both salary + insurance) with timing offset
          const totalOut = salaryAmount + insuranceAmount;
          if (timingDays > 0) {
            const payDate = addDays(dateStr, timingDays);
            if (payDate >= startDate && payDate <= endDate) {
              entries.push({
                date: payDate,
                debitAccount: counterAccount,
                debitSubAccount: null,
                debitAmount: totalOut,
                creditAccount: '1000', // cash
                creditSubAccount: null,
                creditAmount: totalOut,
                taxRuleId: null,
                projectId: null,
                labelId: null,
                memo: `${assumption.name} (payment ${payDate})`,
                sourceType: 'formula',
              });
            }
          }
        }
        continue; // headcount handles all entries for this month
      default:
        amount = 0;
    }

    if (!amount || amount <= 0) continue;

    // Accrual entry
    entries.push({
      date: dateStr,
      debitAccount: expenseAccount,
      debitSubAccount: null,
      debitAmount: amount,
      creditAccount: counterAccount,
      creditSubAccount: null,
      creditAmount: amount,
      taxRuleId: p.taxRuleId || null,
      projectId: p.projectId || null,
      labelId: null,
      memo: `${assumption.name} (expense ${dateStr})`,
      sourceType: 'formula',
    });

    // Cash payment with timing offset
    if (timingDays > 0) {
      const payDate = addDays(dateStr, timingDays);
      if (payDate >= startDate && payDate <= endDate) {
        entries.push({
          date: payDate,
          debitAccount: counterAccount,
          debitSubAccount: null,
          debitAmount: amount,
          creditAccount: '1000', // cash
          creditSubAccount: null,
          creditAmount: amount,
          taxRuleId: null,
          projectId: null,
          labelId: null,
          memo: `${assumption.name} (payment ${payDate})`,
          sourceType: 'formula',
        });
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Preview (issue #267 — E3.6)
// ---------------------------------------------------------------------------

import models from '../../models/index.js';
import { getScenario } from './scenario-service.js';

/**
 * Preview entries from ALL active assumptions in a scenario.
 * Returns flat array of entry objects (not persisted).
 */
export async function previewAll(tenantId, scenarioId) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const assumptions = await models.SimulationAssumption.findAll({
    where: { tenantId, scenarioId, status: 'active' },
    order: [['id', 'ASC']],
  });

  if (!assumptions.length) return { entries: [], count: 0, assumptionCount: 0 };

  const allEntries = [];

  for (const a of assumptions) {
    const entries = _generateEntriesForAssumption(a, scenario);
    allEntries.push(...entries);
  }

  return { entries: allEntries, count: allEntries.length, assumptionCount: assumptions.length };
}

/**
 * Preview entries from a SINGLE assumption.
 */
export async function previewAssumption(tenantId, scenarioId, assumptionId) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const assumption = await models.SimulationAssumption.findOne({
    where: { id: assumptionId, tenantId, scenarioId },
  });
  if (!assumption) return { error: 'assumption not found', code: 404 };

  const entries = _generateEntriesForAssumption(assumption, scenario);
  return { entries, count: entries.length };
}

/**
 * Internal: dispatch to the right generator by assumption.type.
 */
function _generateEntriesForAssumption(assumption, scenario) {
  switch (assumption.type) {
    case 'recurring':
      return generateRecurringEntries(assumption, scenario);
    case 'revenue_growth':
      return generateRevenueGrowthEntries(assumption, scenario, []);
    case 'expense_fixed':
      return generateExpenseFixedEntries(assumption, scenario, []);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Regenerate (issue #268 — E3.7)
// ---------------------------------------------------------------------------

import { createHash } from 'node:crypto';

function hashParams(assumption) {
  const key = JSON.stringify({
    type: assumption.type,
    name: assumption.name,
    parameters: assumption.parameters,
    startMonth: assumption.startMonth,
    endMonth: assumption.endMonth,
    status: assumption.status,
  });
  return createHash('sha256').update(key).digest('hex').slice(0, 64);
}

/**
 * Regenerate all generated entries for a scenario.
 *
 * 1. Hash each active assumption; skip if hash unchanged.
 * 2. Delete existing entries with sourceType IN ('recurring','formula').
 * 3. Generate new entries from all active assumptions.
 * 4. Bulk-insert.
 * 5. Update each assumption's generatedCount + generatedHash.
 *
 * Returns { deletedCount, insertedCount, assumptionCount } for audit.
 */
export async function regenerate(tenantId, scenarioId) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) return { error: 'scenario not found', code: 404 };
  if (scenario.status === 'locked') return { error: 'scenario is locked', code: 409 };

  const assumptions = await models.SimulationAssumption.findAll({
    where: { tenantId, scenarioId, status: 'active' },
    order: [['id', 'ASC']],
  });

  // Phase 1: identify which assumptions have changed (hash differs)
  const changed = [];
  for (const a of assumptions) {
    const h = hashParams(a);
    if (h !== a.generatedHash) {
      changed.push({ assumption: a, hash: h });
    }
  }

  // Only delete if something changed — keep manual entries untouched
  let deleted = 0;
  if (changed.length > 0) {
    deleted = await models.SimulationEntry.destroy({
      where: {
        tenantId,
        scenarioId,
        sourceType: { [models.Sequelize.Op.in]: ['recurring', 'formula'] },
      },
    });
  }

  let insertedCount = 0;

  if (changed.length > 0) {
    const allEntries = [];
    for (const { assumption, hash } of changed) {
      const gen = _generateEntriesForAssumption(assumption, scenario);
      const count = gen.length;

      for (const e of gen) {
        e.tenantId = tenantId;
        e.scenarioId = scenarioId;
      }

      allEntries.push(...gen);
      await assumption.update({ generatedCount: count, generatedHash: hash });
    }

    if (allEntries.length > 0) {
      await models.SimulationEntry.bulkCreate(allEntries);
    }
    insertedCount = allEntries.length;
  }

  return { deletedCount: deleted, insertedCount, assumptionCount: assumptions.length };
}
