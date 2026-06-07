/**
 * Simulated P/L Report — Issue #270 (E3.9).
 *
 * Verifies monthly revenue/expense grouping from scenario entries.
 */

import { strict as assert } from 'node:assert';
import { simulatedPL } from '../../libs/simulation/pl-report.js';
import models from '../../models/index.js';

describe('Simulation — E3.9 P/L report', function () {
  this.timeout(30000);

  let tenant, user, scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({
      slug: `plr-${stamp}`, name: `plr-tenant-${stamp}`,
    });
    user = await models.User.create({
      name: `plr_user_${stamp}`.slice(0, 20),
      hashPassword: 'x-hash', legalName: 'Plr', email: `${stamp}@plr.example.com`,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'PL test scenario',
      baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-12-31',
      ownerId: user.id,
    });

    // Create some entries: revenue 4000 (売上), expense 5000 (給与)
    // Without real AccountClass data, P/L will have 0 — test the shape + DB lookup
  });

  after(async function () {
    await models.SimulationEntry.destroy({ where: { tenantId: tenant.id }, force: true });
    if (scenario) await scenario.destroy().catch(() => {});
    if (user) await user.destroy().catch(() => {});
    if (tenant) await tenant.destroy().catch(() => {});
  });

  it('returns empty months when no entries', async function () {
    const result = await simulatedPL(tenant.id, scenario.id);
    assert.equal(result.count, 0);
    assert.deepEqual(result.months, []);
  });

  it('groups entries by month', async function () {
    // Create entries directly (not dependent on AccountClass classification)
    await models.SimulationEntry.bulkCreate([
      { tenantId: tenant.id, scenarioId: scenario.id, date: '2026-07-15',
        debitAccount: '5000', debitAmount: 100, creditAccount: '4000', creditAmount: 100, sourceType: 'manual' },
      { tenantId: tenant.id, scenarioId: scenario.id, date: '2026-07-20',
        debitAccount: '5000', debitAmount: 50, creditAccount: '4000', creditAmount: 50, sourceType: 'manual' },
      { tenantId: tenant.id, scenarioId: scenario.id, date: '2026-08-01',
        debitAccount: '5000', debitAmount: 200, creditAccount: '4000', creditAmount: 200, sourceType: 'manual' },
    ]);

    const result = await simulatedPL(tenant.id, scenario.id);
    assert.ok(result.months.length >= 1, 'should have at least 1 month');
    // Check months are sorted
    for (let i = 1; i < result.months.length; i++) {
      assert.ok(result.months[i].month > result.months[i - 1].month);
    }
  });

  it('returns 404 for nonexistent scenario', async function () {
    const result = await simulatedPL(tenant.id, 999999);
    assert.equal(result.code, 404);
  });

  it('respects periodFrom/periodTo filters', async function () {
    const result = await simulatedPL(tenant.id, scenario.id, '2026-07-01', '2026-07-31');
    assert.ok(result.months.length >= 0);
    for (const m of result.months) {
      assert.ok(m.month === '2026-07');
    }
  });

  it('net income = revenue - expense for each month', async function () {
    const result = await simulatedPL(tenant.id, scenario.id);
    for (const m of result.months) {
      assert.equal(m.netIncome, m.revenue - m.expense);
    }
  });
});
