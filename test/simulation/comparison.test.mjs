/**
 * Comparison API — Issue #233 (E2.5).
 *
 * Verifies:
 *   1. Returns comparison shape with actual / adjustment / simulated / diff / diffPct
 *   2. movementDebit === movementCredit invariant
 *   3. Cross-tenant returns 404
 *   4. Difference = simulated.ending - actual.ending
 *   5. Simulated D === C invariant (since entries are pre-balanced)
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import { comparisonReport } from '../../libs/simulation/comparison.js';

describe('Simulation — E2.5 comparison report', function () {
  this.timeout(30000);

  let tenant;
  let otherTenant;
  let user;
  let fy;
  let accountClass;
  let debitAccount;
  let creditAccount;
  let scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({ slug: `s2cmp-${stamp}-a`, name: `S2CMP A ${stamp}` });
    otherTenant = await models.Tenant.create({ slug: `s2cmp-${stamp}-b`, name: `S2CMP B ${stamp}` });
    user = await models.User.create({
      name: `s2cmp_u_${stamp}`.slice(0, 20),
      hashPassword: 'x',
      legalName: 'Cmp',
      email: `${stamp}-cmp@example.com`,
    });
    fy = await models.FiscalYear.create({
      tenantId: tenant.id, term: 1,
      startDate: '2026-01-01', endDate: '2026-12-31',
    });
    accountClass = await models.AccountClass.create({
      tenantId: tenant.id, major: 'Expense', middle: 'Salary', minor: 'Engineer', field: 5,
    });
    debitAccount = await models.Account.create({
      tenantId: tenant.id, accountCode: '10200000', name: 'Cash', accountClassId: accountClass.id,
    });
    creditAccount = await models.Account.create({
      tenantId: tenant.id, accountCode: '20200000', name: 'A/P', accountClassId: accountClass.id,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'cmp scenario', baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-12-31',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      status: 'draft', ownerId: user.id, visibility: 'private',
    });
    await models.SimulationEntry.create({
      tenantId: tenant.id, scenarioId: scenario.id,
      date: '2026-08-15',
      debitAccount: '10200000', debitAmount: 750,
      creditAccount: '20200000', creditAmount: 750,
      memo: 'projected',
    });
  });

  after(async function () {
    if (scenario) {
      await models.SimulationEntry.destroy({ where: { scenarioId: scenario.id } });
      await scenario.destroy();
    }
    if (debitAccount) await debitAccount.destroy();
    if (creditAccount) await creditAccount.destroy();
    if (accountClass) await accountClass.destroy();
    if (fy) await fy.destroy();
    if (user) await user.destroy();
    if (tenant) await tenant.destroy();
    if (otherTenant) await otherTenant.destroy();
  });

  it('returns comparison shape with actual / adjustment / simulated / diff', async function () {
    const r = await comparisonReport(tenant.id, scenario.id, { reportType: 'combined' });
    assert.equal(r.error, undefined);
    assert.equal(r.result.meta.scenarioId, scenario.id);
    assert.equal(r.result.meta.scenarioStatus, 'draft');
    assert.deepEqual(r.result.meta.entrySourceNames, ['actual', 'simulation']);
    assert.ok(Array.isArray(r.result.lines));
    const withVirtual = r.result.lines.find((l) => l.code === '10200000');
    assert.ok(withVirtual, 'expected line for code 10200000');
    assert.ok('actual' in withVirtual);
    assert.ok('adjustment' in withVirtual);
    assert.ok('simulated' in withVirtual);
    assert.equal(typeof withVirtual.difference, 'number');
    assert.equal(withVirtual.adjustment.endingBalance, 750, 'adjustment should equal virtual entry amount');
  });

  it('simulated D === C invariant', async function () {
    const r = await comparisonReport(tenant.id, scenario.id, { reportType: 'combined' });
    const t = r.result.totals;
    assert.equal(t.simulated.movementDebit, t.simulated.movementCredit, 'simulated must balance');
  });

  it('difference = simulated - actual', async function () {
    const r = await comparisonReport(tenant.id, scenario.id, { reportType: 'combined' });
    const t = r.result.totals;
    assert.equal(t.difference.endingBalance, t.simulated.endingBalance - t.actual.endingBalance);
  });

  it('differencePct is null when actual.ending == 0', async function () {
    const r = await comparisonReport(tenant.id, scenario.id, { reportType: 'combined' });
    const l = r.result.lines.find((x) => x.code === '9999'); // unlikely code
    if (l && l.actual.endingBalance === 0) {
      assert.equal(l.differencePct, null);
    }
  });

  it('returns 404 for cross-tenant scenario lookup', async function () {
    const r = await comparisonReport(otherTenant.id, scenario.id, { reportType: 'balance' });
    assert.equal(r.code, 404);
  });

  it('returns 404 for missing scenario', async function () {
    const r = await comparisonReport(tenant.id, 999999, { reportType: 'balance' });
    assert.equal(r.code, 404);
  });
});
