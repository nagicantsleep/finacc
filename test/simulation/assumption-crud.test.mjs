/**
 * SimulationAssumption CRUD + JSONB validation — Issue #263 (E3.2).
 *
 * Verifies:
 *   1. JSONB parameter validation per type (recurring, revenue_growth, expense_fixed).
 *   2. CRUD round-trip on test DB (list / create / get / update / delete).
 *   3. Locked scenario rejection (409).
 *   4. Unknown type rejection.
 */

import { strict as assert } from 'node:assert';
import {
  validateParameters,
  listAssumptions,
  createAssumption,
  getAssumption,
  updateAssumption,
  deleteAssumption,
} from '../../libs/simulation/assumption-service.js';
import models from '../../models/index.js';

describe('Simulation — E3.2 Assumption CRUD + schema', function () {
  this.timeout(30000);

  describe('1) JSONB parameter validation', function () {
    it('rejects unknown type', function () {
      const v = validateParameters('bogus', {});
      assert.equal(v.valid, false);
      assert.ok(v.errors[0].includes('unknown type'), v.errors.join(', '));
    });

    it('rejects recurring missing required fields', function () {
      const v = validateParameters('recurring', {});
      assert.equal(v.valid, false);
    });

    it('accepts valid recurring parameters', function () {
      const v = validateParameters('recurring', {
        frequency: 'monthly',
        debitAccount: '5000',
        creditAccount: '2000',
        amount: 300000,
        dayOfMonth: 15,
      });
      assert.equal(v.valid, true, JSON.stringify(v.errors));
    });

    it('accepts valid revenue_growth parameters', function () {
      const v = validateParameters('revenue_growth', {
        revenueAccount: '4000',
        counterAccount: '2000',
        growthType: 'percent',
        growthValue: 5,
        collectionTimingDays: 30,
      });
      assert.equal(v.valid, true, JSON.stringify(v.errors));
    });

    it('rejects revenue_growth with invalid growthType', function () {
      const v = validateParameters('revenue_growth', {
        revenueAccount: '4000',
        counterAccount: '2000',
        growthType: 'invalid_type',
        growthValue: 5,
      });
      assert.equal(v.valid, false, 'should reject invalid growthType');
    });

    it('accepts valid expense_fixed parameters', function () {
      const v = validateParameters('expense_fixed', {
        expenseAccount: '5000',
        counterAccount: '2000',
        amountType: 'fixed',
        amount: 100000,
        paymentTimingDays: 30,
      });
      assert.equal(v.valid, true, JSON.stringify(v.errors));
    });

    it('accepts expense_fixed headcount parameters', function () {
      const v = validateParameters('expense_fixed', {
        expenseAccount: '5000',
        counterAccount: '2000',
        amountType: 'headcount',
        headcount: {
          count: 5,
          salaryPerMonth: 400000,
          salaryAccount: '5000',
          insuranceAccount: '5001',
          insurancePct: 15,
        },
      });
      assert.equal(v.valid, true, JSON.stringify(v.errors));
    });
  });

  describe('2) CRUD round-trip on test DB', function () {
    let tenant, user, scenario;

    before(async function () {
      const stamp = Date.now().toString(36);
      tenant = await models.Tenant.create({
        slug: `asu-${stamp}`, name: `asu-tenant-${stamp}`,
      });
      user = await models.User.create({
        name: `asu_user_${stamp}`.slice(0, 20),
        hashPassword: 'x-hash', legalName: 'Asu', email: `${stamp}@asu.example.com`,
      });
      scenario = await models.SimulationScenario.create({
        tenantId: tenant.id, name: 'ASU test scenario',
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

    it('creates an assumption', async function () {
      const r = await createAssumption(tenant.id, scenario.id, {
        type: 'recurring', name: 'Monthly salary',
        parameters: { frequency: 'monthly', debitAccount: '5000', creditAccount: '2000', amount: 300000 },
        startMonth: '2026-07-01',
      });
      assert.ok(r.assumption, r.error);
      assert.equal(r.assumption.name, 'Monthly salary');
      assert.equal(r.assumption.status, 'active');
    });

    it('lists assumptions', async function () {
      const r = await listAssumptions(tenant.id, scenario.id);
      assert.ok(Array.isArray(r.assumptions));
      assert.ok(r.assumptions.length >= 1);
    });

    it('gets single assumption', async function () {
      const all = await listAssumptions(tenant.id, scenario.id);
      const r = await getAssumption(tenant.id, scenario.id, all.assumptions[0].id);
      assert.ok(r.assumption);
      assert.equal(r.assumption.name, 'Monthly salary');
    });

    it('updates assumption', async function () {
      const all = await listAssumptions(tenant.id, scenario.id);
      const id = all.assumptions[0].id;
      const r = await updateAssumption(tenant.id, scenario.id, id, {
        name: 'Updated salary',
        parameters: { frequency: 'quarterly', debitAccount: '5000', creditAccount: '2000', amount: 900000 },
      });
      assert.ok(r.assumption);
      assert.equal(r.assumption.name, 'Updated salary');
      assert.deepEqual(r.assumption.parameters.frequency, 'quarterly');
    });

    it('deletes assumption', async function () {
      // create a fresh one to delete
      const created = await createAssumption(tenant.id, scenario.id, {
        type: 'recurring', name: 'to-delete',
        parameters: { frequency: 'monthly', debitAccount: '5000', creditAccount: '2000', amount: 1000 },
        startMonth: '2026-07-01',
      });
      const r = await deleteAssumption(tenant.id, scenario.id, created.assumption.id);
      assert.ok(r.ok);

      const gone = await getAssumption(tenant.id, scenario.id, created.assumption.id);
      assert.ok(gone.code === 404);
    });

    it('rejects locked scenario', async function () {
      await scenario.update({ status: 'locked' });
      const r = await createAssumption(tenant.id, scenario.id, {
        type: 'recurring', name: 'should fail',
        parameters: { frequency: 'monthly', debitAccount: '5000', creditAccount: '2000', amount: 1000 },
        startMonth: '2026-07-01',
      });
      assert.equal(r.code, 409);
      await scenario.update({ status: 'draft' });
    });

    it('rejects creation without type', async function () {
      const r = await createAssumption(tenant.id, scenario.id, {
        name: 'no type', parameters: {}, startMonth: '2026-07-01',
      });
      assert.ok(r.error);
    });
  });
});
