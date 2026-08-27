/**
 * Simulation warnings — Issue #273 (E3.12).
 *
 * Detects:
 *   SIM-W010: cash balance negative in any month (from cashProjection)
 *   SIM-W011: recurring assumptions overlap (same account + date)
 *   SIM-W012: expense counter account not found
 */

import models from '../../models/index.js';
import { generateRecurringEntries } from './assumption-generator.js';

/**
 * Detect all warnings for a scenario.
 * @returns { warnings: [{ code, severity, message, detail }] }
 */
export async function detectWarnings(tenantId, scenarioId) {
  const warnings = [];

  // Load active assumptions
  const assumptions = await models.SimulationAssumption.findAll({
    where: { tenantId, scenarioId, status: 'active' },
  });

  const scenario = await models.SimulationScenario.findOne({
    where: { tenantId, id: scenarioId },
  });

  if (!scenario) return { warnings };

  // --- SIM-W011: recurring overlap ---
  const recurrings = assumptions.filter(a => a.type === 'recurring');
  if (recurrings.length > 1) {
    const entryMap = new Map(); // key = "account_date_amount"
    for (const a of recurrings) {
      const entries = generateRecurringEntries(a, scenario);
      for (const e of entries) {
        const key = `${e.debitAccount}_${e.creditAccount}_${e.date}`;
        if (entryMap.has(key)) {
          entryMap.get(key).push(a.name);
        } else {
          entryMap.set(key, [a.name]);
        }
      }
    }
    for (const [key, names] of entryMap) {
      if (names.length > 1) {
        warnings.push({
          code: 'SIM-W011',
          severity: 'low',
          message: `Overlapping recurring entries: ${names.join(', ')}`,
          detail: `Same accounts + date: ${key}`,
        });
      }
    }
  }

  // --- SIM-W012: expense counter account existence ---
  const accountCodes = new Set();
  for (const a of assumptions) {
    const p = a.parameters || {};
    if (p.counterAccount) accountCodes.add(p.counterAccount);
    if (p.creditAccount) accountCodes.add(p.creditAccount);
    if (p.debitAccount) accountCodes.add(p.debitAccount);
  }

  if (accountCodes.size > 0) {
    const existing = await models.Account.findAll({
      where: { tenantId, accountCode: { [models.Sequelize.Op.in]: [...accountCodes] } },
    });
    const existingCodes = new Set(existing.map(a => a.accountCode));

    for (const a of assumptions) {
      const p = a.parameters || {};
      if (p.counterAccount && !existingCodes.has(p.counterAccount)) {
        warnings.push({
          code: 'SIM-W012',
          severity: 'high',
          message: `Counter account ${p.counterAccount} not found for "${a.name}"`,
          detail: `Assumption type: ${a.type}`,
        });
      }
    }
  }

  return { warnings };
}

/**
 * Detect cash warning from projection data.
 * Caller passes the cash projection months array from cashProjection().
 */
export function detectCashWarnings(projectionMonths) {
  const warnings = [];
  for (const m of projectionMonths) {
    if (m.endingCash < 0) {
      warnings.push({
        code: 'SIM-W010',
        severity: 'high',
        message: `Cash balance negative in ${m.month}: ${m.endingCash.toLocaleString()}`,
        detail: `Ending cash of month ${m.month} is below zero`,
      });
    }
  }
  return warnings;
}
