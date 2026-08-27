/**
 * Simulated trial balance — Issue #232 (E2.4).
 *
 * Calls `trialBalanceV2` (E1) with two entry sources:
 *   - 'actual'      — approved CrossSlipDetail rows (reuse actualEntrySource)
 *   - 'simulation'  — SimulationEntry rows for the given scenario
 *
 * Response shape: same v2 contract, plus meta.scenario* and
 * meta.entrySourceNames = ['actual','simulation'].
 *
 * Tenant scoping: scenario must belong to tenantId; cross-tenant returns 404.
 */

import models from '../../models/index.js';
import { trialBalanceV2, actualEntrySource } from '../reporting/trial-balance-v2.js';

function simulationEntrySource(deps, tenantId, scenarioId, fetchStart, fetchEnd) {
  return {
    name: 'simulation',
    fetch: async () => {
      const rows = await deps.SimulationEntry.findAll({
        where: {
          tenantId,
          scenarioId,
          date: {
            [deps.Sequelize.Op.gte]: fetchStart,
            [deps.Sequelize.Op.lt]: fetchEnd,
          },
        },
      });
      return rows.map((r) => ({
        debitAccount: r.debitAccount,
        debitSubAccount: r.debitSubAccount,
        debitAmount: r.debitAmount,
        creditAccount: r.creditAccount,
        creditSubAccount: r.creditSubAccount,
        creditAmount: r.creditAmount,
        approvedAt: 'simulation',
      }));
    },
  };
}

function resolveSimPeriod(deps, tenantId, scenario) {
  const fy = scenario.baseTerm
    ? null
    : null; // baseTerm drives the FiscalYear; sim period drives the entry fetch window.
  const start = scenario.basePeriodFrom instanceof Date
    ? scenario.basePeriodFrom
    : new Date(scenario.basePeriodFrom);
  const end = scenario.basePeriodTo instanceof Date
    ? scenario.basePeriodTo
    : new Date(scenario.basePeriodTo);
  return { startDate: start, endDate: end, fetchStart: start, fetchEnd: new Date(end.getTime() + 24 * 60 * 60 * 1000) };
}

export async function simulatedTrialBalance(tenantId, scenarioId, params = {}) {
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const { startDate, endDate, fetchStart, fetchEnd } = resolveSimPeriod(models, tenantId, scenario);
  const actualSrc = actualEntrySource(models, tenantId, startDate, fetchEnd);
  const simSrc = simulationEntrySource(models, tenantId, scenarioId, fetchStart, fetchEnd);

  const out = await trialBalanceV2(
    {
      tenantId,
      term: scenario.baseTerm,
      reportType: params.reportType || 'balance',
      month: params.month || null,
      accountClassIds: params.accountClassIds || [],
      hideZero: !!params.hideZero,
      includeUnapproved: false,
      languagePair: params.languagePair || null,
      entrySources: [actualSrc, simSrc],
    },
    models,
  );

  // Augment meta with scenario-specific fields.
  out.meta.scenarioId = scenario.id;
  out.meta.scenarioName = scenario.name;
  out.meta.scenarioStatus = scenario.status;
  out.meta.simulationBadge = 'SIMULATION - NOT OFFICIAL ACCOUNTING REPORT';

  // SIM-W001: simulation total should balance. Validate invariant.
  const t = out.meta.totals;
  if (t && (t.movementDebit !== t.movementCredit)) {
    out.meta.warnings = [
      ...(out.meta.warnings || []),
      {
        code: 'SIM-W001',
        severity: 'error',
        message: 'Simulated TB total is unbalanced — entry validator should prevent this',
      },
    ];
  }

  return { result: out };
}
