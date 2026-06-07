/**
 * Simulated trial balance — Issue #232 (E2.4).
 *
 * Verifies the simulated TB API:
 *   1. Returns 404 for missing/cross-tenant scenario
 *   2. Returns v2 shape with meta.scenarioId, scenarioName, scenarioStatus
 *   3. meta.entrySourceNames = ['actual','simulation']
 *   4. SIM-W001 NOT raised when entries are balanced
 *   5. movementDebit === movementCredit invariant holds
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import { simulatedTrialBalance } from '../../libs/simulation/trial-balance.js';

describe('Simulation — E2.4 simulated trial balance', function () {
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
    tenant = await models.Tenant.create({ slug: `s2tb-${stamp}-a`, name: `S2TB A ${stamp}` });
    otherTenant = await models.Tenant.create({ slug: `s2tb-${stamp}-b`, name: `S2TB B ${stamp}` });
    user = await models.User.create({
      name: `s2tb_u_${stamp}`.slice(0, 20),
      hashPassword: 'x',
      legalName: 'TB',
      email: `${stamp}-tb@example.com`,
    });
    fy = await models.FiscalYear.create({
      tenantId: tenant.id, term: 1,
      startDate: '2026-01-01', endDate: '2026-12-31',
    });
    accountClass = await models.AccountClass.create({
      tenantId: tenant.id, major: 'Expense', middle: 'Salary', minor: 'Engineer', field: 5,
    });
    debitAccount = await models.Account.create({
      tenantId: tenant.id, accountCode: '5000', name: 'Salary expense', accountClassId: accountClass.id,
    });
    creditAccount = await models.Account.create({
      tenantId: tenant.id, accountCode: '2000', name: 'Cash', accountClassId: accountClass.id,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'sim tb scenario', baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-12-31',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      status: 'draft', ownerId: user.id, visibility: 'private',
    });
    // One virtual entry.
    await models.SimulationEntry.create({
      tenantId: tenant.id, scenarioId: scenario.id,
      date: '2026-08-15',
      debitAccount: '5000', debitAmount: 500,
      creditAccount: '2000', creditAmount: 500,
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

  it('returns v2 shape with scenario meta + entry source names', async function () {
    const r = await simulatedTrialBalance(tenant.id, scenario.id, { reportType: 'combined' });
    assert.equal(r.error, undefined);
    assert.equal(r.result.version, 2);
    assert.equal(r.result.meta.scenarioId, scenario.id);
    assert.equal(r.result.meta.scenarioName, 'sim tb scenario');
    assert.equal(r.result.meta.scenarioStatus, 'draft');
    assert.deepEqual(r.result.meta.entrySourceNames, ['actual', 'simulation']);
    assert.match(r.result.meta.simulationBadge, /SIMULATION/);
  });

  it('SIM-W001 not raised (entries are balanced)', async function () {
    const r = await simulatedTrialBalance(tenant.id, scenario.id, { reportType: 'combined' });
    const warns = (r.result.meta.warnings || []).map((w) => w.code || w);
    assert.equal(warns.includes('SIM-W001'), false, `unexpected SIM-W001; got ${JSON.stringify(warns)}`);
  });

  it('global D === C invariant holds', async function () {
    const r = await simulatedTrialBalance(tenant.id, scenario.id, { reportType: 'combined' });
    const t = r.result.meta.totals;
    assert.equal(t.movementDebit, t.movementCredit, 'simulated TB must balance');
  });

  it('returns 404 for cross-tenant scenario lookup', async function () {
    const r = await simulatedTrialBalance(otherTenant.id, scenario.id, { reportType: 'balance' });
    assert.equal(r.code, 404);
  });

  it('returns 404 for missing scenario', async function () {
    const r = await simulatedTrialBalance(tenant.id, 999999, { reportType: 'balance' });
    assert.equal(r.code, 404);
  });
});
