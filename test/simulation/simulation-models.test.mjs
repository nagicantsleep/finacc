/**
 * Simulation models — Issue #229 (E2.1).
 *
 * Verifies:
 *   1. SimulationScenario + SimulationEntry models load and expose the schema
 *      documented in `docs/stories/epics/E02-simulation/initiative.md`.
 *   2. Associations are wired (Scenario hasMany Entry, Entry belongsTo Scenario).
 *   3. tenantId is required on both models (NOT NULL enforced at app layer).
 *   4. CRUD round-trip on the live test DB (no stub).
 *
 * Requires a live, migrated Postgres test DB. Run with: npm test
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';

const sequelize = models.sequelize;

describe('Simulation — E2.1 models + migrations', function () {
  this.timeout(30000);

  describe('1) model schema', function () {
    it('SimulationScenario exposes documented fields', function () {
      const attrs = models.SimulationScenario.rawAttributes;
      for (const f of [
        'id', 'tenantId', 'name', 'description',
        'baseTerm', 'basePeriodFrom', 'basePeriodTo',
        'simPeriodFrom', 'simPeriodTo',
        'status', 'ownerId', 'visibility',
        'lockedAt', 'lockedBy', 'createdAt', 'updatedAt',
      ]) {
        assert.ok(attrs[f], `missing field SimulationScenario.${f}`);
      }
      assert.equal(attrs.tenantId.allowNull, false, 'tenantId must be NOT NULL');
      assert.equal(attrs.name.allowNull, false, 'name must be NOT NULL');
      assert.equal(attrs.status.defaultValue, 'draft');
      assert.equal(attrs.visibility.defaultValue, 'private');
    });

    it('SimulationEntry exposes documented fields', function () {
      const attrs = models.SimulationEntry.rawAttributes;
      for (const f of [
        'id', 'tenantId', 'scenarioId', 'date',
        'debitAccount', 'debitSubAccount', 'debitAmount',
        'creditAccount', 'creditSubAccount', 'creditAmount',
        'taxRuleId', 'projectId', 'labelId', 'memo', 'sourceType',
        'createdAt', 'updatedAt',
      ]) {
        assert.ok(attrs[f], `missing field SimulationEntry.${f}`);
      }
      assert.equal(attrs.tenantId.allowNull, false, 'tenantId must be NOT NULL');
      assert.equal(attrs.scenarioId.allowNull, false, 'scenarioId must be NOT NULL');
      assert.equal(attrs.sourceType.defaultValue, 'manual');
    });

    it('SimulationEntry has NO approvedAt (BR-SIM-001)', function () {
      const attrs = models.SimulationEntry.rawAttributes;
      assert.equal(attrs.approvedAt, undefined, 'SimulationEntry must not have approvedAt');
    });
  });

  describe('2) associations', function () {
    it('Scenario hasMany Entry (entries)', function () {
      const a = models.SimulationScenario.associations;
      assert.ok(a.entries, 'SimulationScenario.associations.entries must exist');
      assert.equal(a.entries.foreignKey, 'scenarioId');
    });

    it('Entry belongsTo Scenario (scenario)', function () {
      const a = models.SimulationEntry.associations;
      assert.ok(a.scenario, 'SimulationEntry.associations.scenario must exist');
      assert.equal(a.scenario.foreignKey, 'scenarioId');
    });
  });

  describe('3) CRUD round-trip on test DB', function () {
    let tenant;
    let user;
    let scenario;
    let entry;

    before(async function () {
      const stamp = Date.now().toString(36);
      tenant = await models.Tenant.create({
        slug: `sim-${stamp}`,
        name: `sim-tenant-${stamp}`,
      });
      user = await models.User.create({
        name: `sim_user_${stamp}`.slice(0, 20),
        hashPassword: 'x-hash',
        legalName: 'Sim',
        email: `${stamp}@example.com`,
      });
    });

    after(async function () {
      if (entry) await entry.destroy().catch(() => {});
      if (scenario) await scenario.destroy().catch(() => {});
      if (user) await user.destroy().catch(() => {});
      if (tenant) await tenant.destroy().catch(() => {});
      await sequelize.close();
    });

    it('saves and reads back a Scenario + Entry', async function () {
      scenario = await models.SimulationScenario.create({
        tenantId: tenant.id,
        name: 'Q3 hiring scenario',
        description: 'projected +1 engineer',
        baseTerm: 1,
        basePeriodFrom: '2026-01-01',
        basePeriodTo: '2026-06-30',
        simPeriodFrom: '2026-07-01',
        simPeriodTo: '2026-09-30',
        status: 'draft',
        ownerId: user.id,
        visibility: 'private',
      });
      assert.ok(scenario.id, 'scenario id assigned');
      assert.equal(scenario.status, 'draft');

      entry = await models.SimulationEntry.create({
        tenantId: tenant.id,
        scenarioId: scenario.id,
        date: '2026-07-15',
        debitAccount: '5000',
        debitAmount: 1000.00,
        creditAccount: '2000',
        creditAmount: 1000.00,
        memo: 'projected salary',
      });
      assert.ok(entry.id);

      const reloaded = await models.SimulationScenario.findByPk(scenario.id, {
        include: [{ model: models.SimulationEntry, as: 'entries' }],
      });
      assert.equal(reloaded.name, 'Q3 hiring scenario');
      assert.equal(reloaded.entries.length, 1);
      assert.equal(reloaded.entries[0].memo, 'projected salary');
    });

    it('rejects Entry without tenantId', async function () {
      await assert.rejects(
        models.SimulationEntry.create({
          scenarioId: scenario.id,
          date: '2026-07-15',
          debitAccount: '5000',
          debitAmount: 1,
          creditAccount: '2000',
          creditAmount: 1,
        }),
        /tenantId|notNull/i
      );
    });
  });
});
