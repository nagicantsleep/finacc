/**
 * Preview API — Issue #267 (E3.6).
 *
 * Verifies previewAssumption (1 assumption → entries) and previewAll
 * (all active assumptions → pooled entries). Neither writes to DB.
 */

import { strict as assert } from 'node:assert';
import {
  previewAssumption,
  previewAll,
} from '../../libs/simulation/assumption-generator.js';
import { createAssumption, deleteAssumption } from '../../libs/simulation/assumption-service.js';
import models from '../../models/index.js';

describe('Simulation — E3.6 Preview API', function () {
  this.timeout(30000);

  let tenant, user, scenario, assumption;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({
      slug: `prv-${stamp}`, name: `prv-tenant-${stamp}`,
    });
    user = await models.User.create({
      name: `prv_user_${stamp}`.slice(0, 20),
      hashPassword: 'x-hash', legalName: 'Prv', email: `${stamp}@prv.example.com`,
    });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'Preview test scenario',
      baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-12-31',
      ownerId: user.id,
    });
  });

  after(async function () {
    await models.SimulationAssumption.destroy({ where: { tenantId: tenant.id }, force: true });
    if (scenario) await scenario.destroy().catch(() => {});
    if (user) await user.destroy().catch(() => {});
    if (tenant) await tenant.destroy().catch(() => {});
  });

  it('preview 1 recurring assumption returns correct entry count', async function () {
    const r = await createAssumption(tenant.id, scenario.id, {
      type: 'recurring', name: 'Monthly salary',
      parameters: {
        frequency: 'monthly', dayOfMonth: 15,
        debitAccount: '5000', creditAccount: '2000', amount: 300000,
      },
      startMonth: '2026-07-01',
      endMonth: '2026-12-31',
    });
    assumption = r.assumption;

    const preview = await previewAssumption(tenant.id, scenario.id, assumption.id);
    assert.ok(preview.entries, preview.error);
    // Jul-Dec = 6 monthly entries
    assert.equal(preview.count, 6);
    assert.equal(preview.entries[0].date, '2026-07-15');
    assert.equal(preview.entries[0].sourceType, 'recurring');
    // All balanced
    for (const e of preview.entries) {
      assert.equal(e.debitAmount, e.creditAmount);
    }
  });

  it('previewAll pools multiple assumptions', async function () {
    // Already have 1 recurring. Add a revenue_growth.
    await createAssumption(tenant.id, scenario.id, {
      type: 'revenue_growth', name: 'Revenue 5% growth',
      parameters: {
        growthType: 'percent', growthValue: 1000000, growthRate: 5,
        revenueAccount: '4000', counterAccount: '1200',
      },
      startMonth: '2026-07-01',
      endMonth: '2026-12-31',
    });

    const result = await previewAll(tenant.id, scenario.id);
    assert.ok(result.entries, result.error);
    assert.equal(result.assumptionCount, 2);
    // recurring: 6 months, revenue: 6 months = 12 entries
    assert.equal(result.count, 12);
  });

  it('previewAll with no assumptions returns empty', async function () {
    // Create a new scenario with no assumptions
    const empty = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'Empty scenario',
      baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-12-31',
      ownerId: user.id,
    });
    const result = await previewAll(tenant.id, empty.id);
    assert.equal(result.assumptionCount, 0);
    assert.equal(result.count, 0);
    await empty.destroy();
  });

  it('preview does not write to DB', async function () {
    // Count SimulationEntries before and after preview
    const before = await models.SimulationEntry.count({ where: { tenantId: tenant.id } });
    await previewAll(tenant.id, scenario.id);
    const after = await models.SimulationEntry.count({ where: { tenantId: tenant.id } });
    assert.equal(after, before, 'preview must not persist entries');
  });

  it('preview returns 404 for nonexistent scenario', async function () {
    const result = await previewAll(tenant.id, 999999);
    assert.equal(result.code, 404);
  });
});
