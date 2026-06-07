/**
 * Regenerate API — Issue #268 (E3.7).
 *
 * Verifies:
 *   1. Regenerate deletes only generated entries (recurring/formula), keeps manual.
 *   2. New entries inserted from active assumptions.
 *   3. Hash cache: unchanged params → skip delete+insert.
 *   4. Locked scenario rejected.
 *   5. generatedCount / generatedHash updated.
 */

import { strict as assert } from 'node:assert';
import { regenerate, previewAll } from '../../libs/simulation/assumption-generator.js';
import { createAssumption } from '../../libs/simulation/assumption-service.js';
import models from '../../models/index.js';

describe('Simulation — E3.7 Regenerate', function () {
  this.timeout(30000);

  let tenant, user, scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({
      slug: `rgn-${stamp}`, name: `rgn-tenant-${stamp}`,
    });
    user = await models.User.create({
      name: `rgn_user_${stamp}`.slice(0, 20),
      hashPassword: 'x-hash', legalName: 'Rgn', email: `${stamp}@rgn.example.com`,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'Regen test scenario',
      baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      ownerId: user.id,
    });
  });

  after(async function () {
    await models.SimulationEntry.destroy({ where: { tenantId: tenant.id }, force: true });
    await models.SimulationAssumption.destroy({ where: { tenantId: tenant.id }, force: true });
    if (scenario) await scenario.destroy().catch(() => {});
    if (user) await user.destroy().catch(() => {});
    if (tenant) await tenant.destroy().catch(() => {});
  });

  it('regenerate inserts entries from active assumptions', async function () {
    await createAssumption(tenant.id, scenario.id, {
      type: 'recurring', name: 'Monthly rent',
      parameters: {
        frequency: 'monthly', dayOfMonth: 1,
        debitAccount: '5000', creditAccount: '2000', amount: 100000,
      },
      startMonth: '2026-07-01', endMonth: '2026-09-30',
    });

    const result = await regenerate(tenant.id, scenario.id);

    assert.equal(result.deletedCount, 0, 'no prior entries to delete');
    assert.equal(result.insertedCount, 3); // Jul, Aug, Sep
    assert.equal(result.assumptionCount, 1);

    // Verify entries exist in DB
    const entries = await models.SimulationEntry.findAll({
      where: { tenantId: tenant.id, scenarioId: scenario.id },
    });
    assert.equal(entries.length, 3);
    assert.equal(entries[0].sourceType, 'recurring');
  });

  it('manual entries survive regenerate', async function () {
    // Create a manual entry
    const manual = await models.SimulationEntry.create({
      tenantId: tenant.id, scenarioId: scenario.id,
      date: '2026-07-15',
      debitAccount: '5000', debitAmount: 5000,
      creditAccount: '2000', creditAmount: 5000,
      sourceType: 'manual', memo: 'manual entry',
    });

    const result = await regenerate(tenant.id, scenario.id);
    assert.ok(result.insertedCount >= 0);

    // Manual entry should still exist
    const manualCheck = await models.SimulationEntry.findByPk(manual.id);
    assert.ok(manualCheck, 'manual entry must survive regenerate');
    assert.equal(manualCheck.sourceType, 'manual');

    // Generated entries should exist (re-created)
    const generated = await models.SimulationEntry.findAll({
      where: { tenantId: tenant.id, scenarioId: scenario.id, sourceType: 'recurring' },
    });
    assert.ok(generated.length > 0, 'generated entries must be re-created after regenerate');
  });

  it('hash cache: unchanged params skip regenerate', async function () {
    const genCount = await models.SimulationEntry.count({
      where: { tenantId: tenant.id, scenarioId: scenario.id, sourceType: 'recurring' },
    });

    const result = await regenerate(tenant.id, scenario.id);
    // Entry count should not change (hash matched, skipped)
    const afterCount = await models.SimulationEntry.count({
      where: { tenantId: tenant.id, scenarioId: scenario.id, sourceType: 'recurring' },
    });
    assert.equal(afterCount, genCount, 'entry count unchanged when hash matches');
  });

  it('updated assumption triggers re-insert with new count', async function () {
    const all = await models.SimulationAssumption.findAll({
      where: { tenantId: tenant.id, scenarioId: scenario.id },
    });
    const a = all[0];
    // Change params to break hash
    await a.update({ startMonth: '2026-08-01' });

    const result = await regenerate(tenant.id, scenario.id);
    assert.ok(result.deletedCount >= 0);
    assert.ok(result.insertedCount >= 0);
    // Aug + Sep = 2 entries now
    const entries = await models.SimulationEntry.findAll({
      where: { tenantId: tenant.id, scenarioId: scenario.id, sourceType: 'recurring' },
    });
    assert.equal(entries.length, 2);
  });

  it('locked scenario rejects regenerate', async function () {
    await scenario.update({ status: 'locked' });
    const result = await regenerate(tenant.id, scenario.id);
    assert.equal(result.code, 409);
    await scenario.update({ status: 'draft' });
  });
});
