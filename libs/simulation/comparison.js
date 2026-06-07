/**
 * Comparison API — Issue #233 (E2.5).
 *
 * Runs `trialBalanceV2` twice:
 *   1. actual only
 *   2. actual + simulation
 *
 * Then diffs the per-line shapes into:
 *   { actual, adjustment, simulated, difference, differencePct }
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

function keyOf(line) {
  return line.subAccountId != null
    ? `sub:${line.accountId}:${line.subCode}`
    : `acc:${line.accountId}`;
}

function diffShape(actual, sim) {
  const actualMovDebit = actual?.movementDebit || 0;
  const actualMovCredit = actual?.movementCredit || 0;
  const actualEnd = actual?.balance || 0;
  const simMovDebit = sim?.movementDebit || 0;
  const simMovCredit = sim?.movementCredit || 0;
  const simEnd = sim?.balance || 0;
  const adjMovDebit = simMovDebit - actualMovDebit;
  const adjMovCredit = simMovCredit - actualMovCredit;
  const adjEnd = simEnd - actualEnd;
  const diff = simEnd - actualEnd;
  const diffPct = actualEnd !== 0 ? (diff / Math.abs(actualEnd)) * 100 : null;
  return {
    actual: { movementDebit: actualMovDebit, movementCredit: actualMovCredit, endingBalance: actualEnd },
    adjustment: { movementDebit: adjMovDebit, movementCredit: adjMovCredit, endingBalance: adjEnd },
    simulated: { movementDebit: simMovDebit, movementCredit: simMovCredit, endingBalance: simEnd },
    difference: diff,
    differencePct: diffPct,
  };
}

export async function comparisonReport(tenantId, scenarioId, params = {}) {
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const start = scenario.basePeriodFrom instanceof Date
    ? scenario.basePeriodFrom
    : new Date(scenario.basePeriodFrom);
  const end = scenario.basePeriodTo instanceof Date
    ? scenario.basePeriodTo
    : new Date(scenario.basePeriodTo);
  const fetchEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  const common = {
    tenantId,
    term: scenario.baseTerm,
    reportType: params.reportType || 'balance',
    month: params.month || null,
    accountClassIds: params.accountClassIds || [],
    hideZero: !!params.hideZero,
    includeUnapproved: false,
    languagePair: params.languagePair || null,
  };

  const actualOnly = await trialBalanceV2(
    { ...common, entrySources: [actualEntrySource(models, tenantId, start, fetchEnd)] },
    models,
  );
  const simAdded = await trialBalanceV2(
    {
      ...common,
      entrySources: [
        actualEntrySource(models, tenantId, start, fetchEnd),
        simulationEntrySource(models, tenantId, scenarioId, start, fetchEnd),
      ],
    },
    models,
  );

  const byKeyA = new Map(actualOnly.lines.map((l) => [keyOf(l), l]));
  const byKeyS = new Map(simAdded.lines.map((l) => [keyOf(l), l]));
  const allKeys = new Set([...byKeyA.keys(), ...byKeyS.keys()]);

  const lines = [...allKeys].map((k) => {
    const a = byKeyA.get(k);
    const s = byKeyS.get(k);
    const base = s || a;
    const d = diffShape(a, s);
    return {
      type: base.type,
      accountClassId: base.accountClassId,
      aclCode: base.aclCode,
      major: base.major,
      middle: base.middle,
      minor: base.minor,
      majorVi: base.majorVi,
      middleVi: base.middleVi,
      minorVi: base.minorVi,
      accountId: base.accountId,
      code: base.code,
      name: base.name,
      nameVi: base.nameVi,
      subAccountId: base.subAccountId,
      subCode: base.subCode,
      subName: base.subName,
      subNameVi: base.subNameVi,
      ...d,
    };
  });

  const totals = lines.reduce(
    (acc, l) => {
      acc.actual.movementDebit += l.actual.movementDebit;
      acc.actual.movementCredit += l.actual.movementCredit;
      acc.actual.endingBalance += l.actual.endingBalance;
      acc.simulated.movementDebit += l.simulated.movementDebit;
      acc.simulated.movementCredit += l.simulated.movementCredit;
      acc.simulated.endingBalance += l.simulated.endingBalance;
      return acc;
    },
    {
      actual: { movementDebit: 0, movementCredit: 0, endingBalance: 0 },
      simulated: { movementDebit: 0, movementCredit: 0, endingBalance: 0 },
      difference: { movementDebit: 0, movementCredit: 0, endingBalance: 0 },
    }
  );
  totals.difference = {
    movementDebit: totals.simulated.movementDebit - totals.actual.movementDebit,
    movementCredit: totals.simulated.movementCredit - totals.actual.movementCredit,
    endingBalance: totals.simulated.endingBalance - totals.actual.endingBalance,
  };

  const warnings = [];
  if (totals.simulated.movementDebit !== totals.simulated.movementCredit) {
    warnings.push({ code: 'SIM-W001', severity: 'error', message: 'Simulated total is unbalanced' });
  }
  // SIM-W002: scenario locked bypassed (cannot detect from here; reported by route)
  if (scenario.status === 'locked') {
    warnings.push({
      code: 'SIM-W002',
      severity: 'info',
      message: 'Scenario is locked — entries are frozen, view only',
    });
  }

  return {
    result: {
      version: 1,
      meta: {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        scenarioStatus: scenario.status,
        term: scenario.baseTerm,
        period: { from: start, to: end },
        languageMode: actualOnly.meta.languageMode,
        generatedAt: new Date(),
        entrySourceNames: ['actual', 'simulation'],
        simulationBadge: 'SIMULATION - NOT OFFICIAL ACCOUNTING REPORT',
      },
      lines,
      totals,
      warnings,
    },
  };
}
