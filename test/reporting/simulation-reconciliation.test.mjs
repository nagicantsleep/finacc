/**
 * Simulation reconciliation — Issue #243 (E2.15).
 *
 * Invariant:
 *   simulated.endingBalance(account) = actual.endingBalance(account) + Σ virtual entries(account)
 *
 * Proven by running the simulated TB (actual + simulation) and the actual-only
 * TB over the same tenant/term/period and asserting the per-line difference
 * equals the sum of virtual entry movement for that account.
 *
 * Also asserts the global invariant Σ simulated.movementDebit === Σ movementCredit
 * (always balanced because entries are validated debit==credit).
 *
 * Requires a live, migrated Postgres test DB.
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import { simulatedTrialBalance } from '../../libs/simulation/trial-balance.js';
import { trialBalanceV2, actualEntrySource } from '../../libs/reporting/trial-balance-v2.js';
import { createTestTenant, destroyTestTenant } from '../helpers/createTestTenant.mjs';

const DAY = 24 * 60 * 60 * 1000;

describe('Simulation — E2.15 reconciliation', function () {
  this.timeout(60000);

  let ctx;
  let scenario;
  let crossSlip;

  before(async function () {
    ctx = await createTestTenant({ tag: 's2rec', mode: 'complete' });

    // Actual approved cross slip: debit 10200000 / credit 20200000 = 3000 on 2026-03-10.
    crossSlip = await models.CrossSlip.create({
      tenantId: ctx.tenant.id, year: 2026, month: 3, day: 10, no: 1, lineCount: 1, term: 1,
      approvedAt: new Date('2026-03-11'), approvedBy: ctx.user.id, createdBy: ctx.user.id,
    });
    await models.CrossSlipDetail.create({
      tenantId: ctx.tenant.id, crossSlipId: crossSlip.id, lineNo: 1,
      debitAccount: '10200000', debitAmount: 3000,
      creditAccount: '20200000', creditAmount: 3000,
    });

    // Scenario with 2 virtual entries: +1000 and +500 to asset (debit 10200000).
    scenario = await models.SimulationScenario.create({
      tenantId: ctx.tenant.id, name: 'reconciliation scenario', baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-12-31',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      status: 'draft', ownerId: ctx.user.id, visibility: 'private',
    });
    for (const amt of [1000, 500]) {
      await models.SimulationEntry.create({
        tenantId: ctx.tenant.id, scenarioId: scenario.id, date: '2026-08-15',
        debitAccount: '10200000', debitAmount: amt, creditAccount: '20200000', creditAmount: amt,
      });
    }
  });

  after(async function () {
    if (scenario) { await models.SimulationEntry.destroy({ where: { scenarioId: scenario.id } }); await scenario.destroy(); }
    if (crossSlip) { await models.CrossSlipDetail.destroy({ where: { crossSlipId: crossSlip.id } }); await crossSlip.destroy(); }
    await destroyTestTenant(ctx);
  });

  function lineFor(out, code) {
    return (out.lines || []).find((l) => l.code === code && l.subAccountId == null);
  }

  it('simulated.ending = actual.ending + Σ virtual entries per account', async function () {
    // actual-only TB (full year so the March slip is included).
    const start = new Date('2026-01-01');
    const fetchEnd = new Date(new Date('2026-12-31').getTime() + DAY);
    const actualOnly = await trialBalanceV2(
      {
        tenantId: ctx.tenant.id, term: 1, reportType: 'combined',
        entrySources: [actualEntrySource(models, ctx.tenant.id, start, fetchEnd)],
      },
      models,
    );
    const sim = await simulatedTrialBalance(ctx.tenant.id, scenario.id, { reportType: 'combined' });
    assert.equal(sim.error, undefined);

    // Asset 10200000 (D-nature): actual debit 3000 → +3000; virtual +1500 → simulated +4500.
    const aA = lineFor(actualOnly, '10200000');
    const sA = lineFor(sim.result, '10200000');
    assert.ok(aA && sA, 'asset line present in both');
    const virtualAsset = 1500; // sum of debit virtual entries on 10200000
    assert.equal(sA.balance - aA.balance, virtualAsset, 'asset diff equals Σ virtual entries');

    // Liability 20200000 (C-nature): actual credit 3000, virtual credit +1500.
    const aL = lineFor(actualOnly, '20200000');
    const sL = lineFor(sim.result, '20200000');
    assert.ok(aL && sL, 'liability line present in both');
    assert.equal(sL.balance - aL.balance, 1500, 'liability diff equals Σ virtual entries');
  });

  it('global invariant: Σ simulated.movementDebit === Σ movementCredit', async function () {
    const sim = await simulatedTrialBalance(ctx.tenant.id, scenario.id, { reportType: 'combined' });
    const t = sim.result.meta.totals;
    assert.equal(t.movementDebit, t.movementCredit, 'simulated TB must balance');
    // actual 3000 + virtual 1500 = 4500 on each side
    assert.equal(t.movementDebit, 4500, 'total debit movement = actual + virtual');
  });

  it('no virtual entry leaks into actual-only TB', async function () {
    const start = new Date('2026-01-01');
    const fetchEnd = new Date(new Date('2026-12-31').getTime() + DAY);
    const actualOnly = await trialBalanceV2(
      {
        tenantId: ctx.tenant.id, term: 1, reportType: 'combined',
        entrySources: [actualEntrySource(models, ctx.tenant.id, start, fetchEnd)],
      },
      models,
    );
    const aA = lineFor(actualOnly, '10200000');
    // actual-only movement must be exactly 3000 (no virtual 1500 leak).
    assert.equal(aA.movementDebit, 3000, 'actual TB excludes virtual entries');
  });
});
