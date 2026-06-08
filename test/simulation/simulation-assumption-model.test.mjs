import { strict as assert } from 'node:assert';
import models from '../../models/index.js';

describe('Simulation — E3.1 SimulationAssumption model', function () {
  this.timeout(30000);

  describe('1) model schema', function () {
    it('SimulationAssumption exposes documented fields', function () {
      const attrs = models.SimulationAssumption.rawAttributes;
      for (const f of [
        'id', 'tenantId', 'scenarioId', 'type', 'name',
        'parameters', 'startMonth', 'endMonth', 'status',
        'generatedCount', 'generatedHash', 'createdAt', 'updatedAt',
      ]) {
        assert.ok(attrs[f], `missing field SimulationAssumption.${f}`);
      }
      assert.equal(attrs.tenantId.allowNull, false, 'tenantId must be NOT NULL');
      assert.equal(attrs.scenarioId.allowNull, false, 'scenarioId must be NOT NULL');
      assert.equal(attrs.type.allowNull, false, 'type must be NOT NULL');
      assert.equal(attrs.name.allowNull, false, 'name must be NOT NULL');
      assert.equal(attrs.parameters.allowNull, false, 'parameters must be NOT NULL');
      assert.equal(attrs.startMonth.allowNull, false, 'startMonth must be NOT NULL');
      assert.equal(attrs.status.defaultValue, 'active');
      assert.equal(attrs.generatedCount.defaultValue, 0);
    });
  });

  describe('2) associations', function () {
    it('Assumption belongsTo Scenario (scenario)', function () {
      const a = models.SimulationAssumption.associations;
      assert.ok(a.scenario, 'SimulationAssumption.associations.scenario must exist');
      assert.equal(a.scenario.foreignKey, 'scenarioId');
    });
    it('Scenario hasMany Assumptions (assumptions)', function () {
      const a = models.SimulationScenario.associations;
      assert.ok(a.assumptions, 'SimulationScenario.associations.assumptions must exist');
      assert.equal(a.assumptions.foreignKey, 'scenarioId');
    });
  });

  describe('3) CRUD round-trip on test DB', function () {
    let tenant, user, scenario, assumption;

    before(async function () {
      const stamp = Date.now().toString(36);
      tenant = await models.Tenant.create({
        slug: `asm-${stamp}`, name: `asm-tenant-${stamp}`,
      });
      user = await models.User.create({
        name: `asm_user_${stamp}`.slice(0, 20),
        hashPassword: 'x-hash', legalName: 'Asm', email: `${stamp}@asm.example.com`,
      });
    });

    after(async function () {
      if (assumption) await assumption.destroy().catch(() => {});
      if (scenario) await scenario.destroy().catch(() => {});
      if (user) await user.destroy().catch(() => {});
      if (tenant) await tenant.destroy().catch(() => {});
    });

    it('saves and reads back an Assumption under a Scenario', async function () {
      scenario = await models.SimulationScenario.create({
        tenantId: tenant.id, name: 'ASM test scenario',
        baseTerm: 1, basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
        simPeriodFrom: '2026-07-01', simPeriodTo: '2026-12-31',
        ownerId: user.id,
      });

      assumption = await models.SimulationAssumption.create({
        tenantId: tenant.id,
        scenarioId: scenario.id,
        type: 'recurring',
        name: 'Monthly salary',
        parameters: { frequency: 'monthly', dayOfMonth: 15, debitAccount: '5000', creditAccount: '2000', amount: 300000 },
        startMonth: '2026-07-01',
        endMonth: '2026-12-31',
      });
      assert.ok(assumption.id, 'assumption id assigned');
      assert.equal(assumption.type, 'recurring');
      assert.equal(assumption.status, 'active');
      assert.equal(assumption.generatedCount, 0);
      assert.deepEqual(assumption.parameters.frequency, 'monthly');
    });

    it('loads assumptions via Scenario include', async function () {
      const loaded = await models.SimulationScenario.findByPk(scenario.id, {
        include: [{ model: models.SimulationAssumption, as: 'assumptions' }],
      });
      assert.equal(loaded.assumptions.length, 1);
      assert.equal(loaded.assumptions[0].name, 'Monthly salary');
    });

    it('rejects Assumption without tenantId', async function () {
      await assert.rejects(
        models.SimulationAssumption.create({
          scenarioId: scenario.id, type: 'recurring', name: 'No tenant',
          parameters: {}, startMonth: '2026-07-01',
        }),
        /tenantId|notNull/i
      );
    });
  });
});
