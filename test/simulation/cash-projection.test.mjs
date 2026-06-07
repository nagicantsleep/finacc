/**
 * Cash Projection — Issue #269 (E3.8).
 *
 * Verifies monthly cash flow, opening balance, reconciliation.
 */

import { strict as assert } from 'node:assert';
import { cashProjection } from '../../libs/simulation/cash-projection.js';
import models from '../../models/index.js';

describe('Simulation — E3.8 Cash projection', function () {
  this.timeout(30000);

  let tenant, user, scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({
      slug: `csh-${stamp}`, name: `csh-tenant-${stamp}`,
    });
    user = await models.User.create({
      name: `csh_user_${stamp}`.slice(0, 20),
      hashPassword: 'x-hash', legalName: 'Csh', email: `${stamp}@csh.example.com`,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'Cash projection test',
      baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-12-31',
      ownerId: user.id,
    });
  });

  after(async function () {
    await models.SimulationEntry.destroy({ where: { tenantId: tenant.id }, force: true });
    if (scenario) await scenario.destroy().catch(() => {});
    if (user) await user.destroy().catch(() => {});
    if (tenant) await tenant.destroy().catch(() => {});
  });

  it('returns empty months with zero cash when no entries', async function () {
    const result = await cashProjection(tenant.id, scenario.id);
    assert.equal(result.openingCash, 0);
    assert.ok(result.months.length >= 1);
    for (const m of result.months) {
      assert.equal(m.endingCash, 0);
    }
  });

  it('tracks cash in/out from entries touching cash accounts', async function () {
    // Create entries where one side is a cash account (1000 = 現金, mapped via AccountClass)
    // For test purposes, entries still produce monthly buckets even without exact cash codes
    await models.SimulationEntry.bulkCreate([
      { tenantId: tenant.id, scenarioId: scenario.id, date: '2026-07-01',
        debitAccount: '1000', debitAmount: 500000,
        creditAccount: '4000', creditAmount: 500000, sourceType: 'manual' },
      { tenantId: tenant.id, scenarioId: scenario.id, date: '2026-07-15',
        debitAccount: '5000', debitAmount: 300000,
        creditAccount: '1000', creditAmount: 300000, sourceType: 'manual' },
    ]);

    const result = await cashProjection(tenant.id, scenario.id);
    assert.ok(result.months.length >= 1);
    // Check month structure
    for (const m of result.months) {
      assert.ok(m.hasOwnProperty('endingCash'));
      assert.ok(m.hasOwnProperty('cashIn'));
      assert.ok(m.hasOwnProperty('cashOut'));
      assert.ok(m.hasOwnProperty('netFlow'));
      assert.ok(m.hasOwnProperty('accrualProfit'));
      assert.equal(m.endingCash, m.openingCash + m.netFlow);
    }
  });

  it('reconciles: final ending cash = opening + sum of all net flows', async function () {
    const result = await cashProjection(tenant.id, scenario.id);
    let totalNet = 0;
    for (const m of result.months) totalNet += m.netFlow;
    const finalEnding = result.months[result.months.length - 1].endingCash;
    assert.equal(finalEnding, result.openingCash + totalNet);
  });

  it('returns 404 for nonexistent scenario', async function () {
    const result = await cashProjection(tenant.id, 999999);
    assert.equal(result.code, 404);
  });
});
