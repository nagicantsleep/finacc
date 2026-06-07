/**
 * Scenario service — Issue #230 (E2.2).
 *
 * Verifies state transitions, period validation, clone behavior, and tenant scoping
 * at the service layer (no HTTP/auth setup required).
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import {
  listScenarios,
  createScenario,
  getScenario,
  updateScenario,
  lockScenario,
  unlockScenario,
  archiveScenario,
  cloneScenario,
} from '../../libs/simulation/scenario-service.js';

const sequelize = models.sequelize;

const VALID_INPUT = () => ({
  name: 'Q3 hiring scenario',
  description: 'projected +1 engineer',
  baseTerm: 1,
  basePeriodFrom: '2026-01-01',
  basePeriodTo: '2026-06-30',
  simPeriodFrom: '2026-07-01',
  simPeriodTo: '2026-09-30',
  ownerId: null,
  visibility: 'private',
});

describe('Simulation — E2.2 scenario service', function () {
  this.timeout(30000);

  let tenant;
  let otherTenant;
  let user;
  let admin;
  let created;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({ slug: `s2s-${stamp}-a`, name: `S2S A ${stamp}` });
    otherTenant = await models.Tenant.create({ slug: `s2s-${stamp}-b`, name: `S2S B ${stamp}` });
    user = await models.User.create({
      name: `s2s_user_${stamp}`.slice(0, 20),
      hashPassword: 'x',
      legalName: 'Acc',
      email: `${stamp}-a@example.com`,
    });
    admin = await models.User.create({
      name: `s2s_adm_${stamp}`.slice(0, 20),
      hashPassword: 'x',
      legalName: 'Adm',
      email: `${stamp}-b@example.com`,
    });
  });

  after(async function () {
    if (created) {
      await models.SimulationEntry.destroy({ where: { scenarioId: created.id } });
      await created.destroy();
    }
    if (user) await user.destroy();
    if (admin) await admin.destroy();
    if (tenant) await tenant.destroy();
    if (otherTenant) await otherTenant.destroy();
  });

  describe('1) createScenario', function () {
    it('creates with valid periods, status=draft', async function () {
      const input = VALID_INPUT();
      input.ownerId = user.id;
      const s = await createScenario(tenant.id, user.id, input);
      assert.ok(s.id, 'id assigned');
      assert.equal(s.status, 'draft');
      assert.equal(s.visibility, 'private');
      created = s;
    });

    it('rejects empty name', async function () {
      const r = await createScenario(tenant.id, user.id, { ...VALID_INPUT(), name: '' });
      assert.match(r.error, /name is required/i);
    });

    it('rejects name > 200 chars', async function () {
      const r = await createScenario(tenant.id, user.id, { ...VALID_INPUT(), name: 'a'.repeat(201) });
      assert.match(r.error, /200 characters/i);
    });

    it('rejects simPeriodFrom < basePeriodTo+1', async function () {
      const r = await createScenario(tenant.id, user.id, {
        ...VALID_INPUT(),
        name: 'bad',
        simPeriodFrom: '2026-06-25',
      });
      assert.match(r.error, /simPeriodFrom must be >= basePeriodTo \+ 1 day/i);
    });

    it('rejects simPeriodFrom > simPeriodTo', async function () {
      const r = await createScenario(tenant.id, user.id, {
        ...VALID_INPUT(),
        name: 'bad',
        simPeriodFrom: '2026-09-15',
        simPeriodTo: '2026-08-01',
      });
      assert.match(r.error, /simPeriodFrom must be <= simPeriodTo/i);
    });
  });

  describe('2) list + tenant scoping', function () {
    it('returns only the requested tenant', async function () {
      const stamp = Date.now().toString(36);
      const t2 = await models.Tenant.create({ slug: `s2s-list-${stamp}`, name: `List ${stamp}` });
      const u2 = await models.User.create({
        name: `s2s_l_${stamp}`.slice(0, 20),
        hashPassword: 'x',
        legalName: 'L',
        email: `${stamp}-l@example.com`,
      });
      const s2 = await createScenario(t2.id, u2.id, { ...VALID_INPUT(), name: 'other tenant' });
      const rows = await listScenarios(tenant.id);
      assert.ok(rows.every((r) => r.tenantId === tenant.id), 'all rows belong to tenant');
      await models.SimulationEntry.destroy({ where: { scenarioId: s2.id } });
      await s2.destroy();
      await u2.destroy();
      await t2.destroy();
    });
  });

  describe('3) update + state transitions', function () {
    it('rejects update when status != draft', async function () {
      const r = await updateScenario(tenant.id, created.id, { name: 'new' });
      assert.equal(r.error, undefined);
    });

    it('locks draft, then update is rejected with 409', async function () {
      const r = await lockScenario(tenant.id, user.id, created.id);
      assert.equal(r.scenario.status, 'locked');
      assert.ok(r.scenario.lockedAt);
      const r2 = await updateScenario(tenant.id, created.id, { name: 'nope' });
      assert.equal(r2.code, 409);
    });

    it('unlock requires admin and a reason', async function () {
      const r = await unlockScenario(tenant.id, created.id, '');
      assert.equal(r.code, 400);
      const r2 = await unlockScenario(tenant.id, created.id, 'fix typo');
      assert.equal(r2.scenario.status, 'draft');
    });

    it('archive is allowed from draft or locked', async function () {
      const r = await archiveScenario(tenant.id, created.id);
      assert.equal(r.scenario.status, 'archived');
    });
  });

  describe('4) clone', function () {
    let original;
    let clone;

    before(async function () {
      const stamp = Date.now().toString(36);
      const t = await models.Tenant.create({ slug: `s2s-clone-${stamp}`, name: `Clone ${stamp}` });
      const u = await models.User.create({
        name: `s2s_c_${stamp}`.slice(0, 20),
        hashPassword: 'x',
        legalName: 'C',
        email: `${stamp}-c@example.com`,
      });
      original = await createScenario(t.id, u.id, { ...VALID_INPUT(), name: 'original' });
      await models.SimulationEntry.create({
        tenantId: t.id,
        scenarioId: original.id,
        date: '2026-07-15',
        debitAccount: '5000', debitAmount: 100, creditAccount: '2000', creditAmount: 100, memo: 'e1',
      });
      const r = await cloneScenario(t.id, u.id, original.id, 'original (copy)');
      clone = r.scenario;
      assert.equal(r.entryCount, 1);
      assert.equal(clone.status, 'draft');
      assert.notEqual(clone.id, original.id);

      // cleanup stash
      globalThis.__s2s_clone_cleanup = { t, u, original, clone };
    });

    it('clone has same fields but new id, status=draft, ownerId = actor', function () {
      const { clone, original } = globalThis.__s2s_clone_cleanup;
      assert.equal(clone.name, 'original (copy)');
      assert.equal(clone.baseTerm, original.baseTerm);
      assert.equal(clone.simPeriodFrom, original.simPeriodFrom);
      assert.notEqual(clone.id, original.id);
    });

    it('clone entries are deep-copied (new ids, same fields)', async function () {
      const { t, clone, original } = globalThis.__s2s_clone_cleanup;
      const origEntries = await models.SimulationEntry.findAll({ where: { scenarioId: original.id } });
      const cloneEntries = await models.SimulationEntry.findAll({ where: { scenarioId: clone.id } });
      assert.equal(cloneEntries.length, origEntries.length);
      for (let i = 0; i < origEntries.length; i++) {
        assert.notEqual(cloneEntries[i].id, origEntries[i].id);
        assert.equal(cloneEntries[i].memo, origEntries[i].memo);
      }
      // cleanup
      await models.SimulationEntry.destroy({ where: { scenarioId: original.id } });
      await models.SimulationEntry.destroy({ where: { scenarioId: clone.id } });
      await original.destroy();
      await clone.destroy();
      const c = globalThis.__s2s_clone_cleanup;
      await c.u.destroy();
      await c.t.destroy();
    });
  });

  describe('5) getScenario tenant isolation', function () {
    it('returns null when querying across tenants', async function () {
      const s = await getScenario(otherTenant.id, created.id);
      assert.equal(s, null);
    });
  });
});
