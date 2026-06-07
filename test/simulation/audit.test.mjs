/**
 * Audit helper + history — Issue #241 (E2.13).
 *
 * Verifies the shared audit() writer and auditHistory() query for simulation
 * events keyed by (entityType, entityId) in the JSONB payload.
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import { audit, auditHistory } from '../../libs/audit.js';

describe('Simulation — E2.13 audit log', function () {
  this.timeout(30000);

  let tenant;
  let scenarioId;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({ slug: `s2aud-${stamp}`, name: `S2AUD ${stamp}` });
    scenarioId = 900000 + Math.floor((Date.now() % 90000));
  });

  after(async function () {
    await models.AuditEvent.destroy({ where: { tenantId: tenant.id } });
    if (tenant) await tenant.destroy();
  });

  it('audit() requires tenantId and action', async function () {
    await assert.rejects(() => audit({ action: 'x' }), /tenantId is required/);
    await assert.rejects(() => audit({ tenantId: tenant.id }), /action is required/);
  });

  it('writes a scenario create event with entity payload', async function () {
    const ev = await audit({
      tenantId: tenant.id,
      actorId: 1,
      action: 'simulation:scenario:create',
      entityType: 'SimulationScenario',
      entityId: scenarioId,
      diff: { name: 'test' },
    });
    assert.ok(ev.id);
    assert.equal(ev.payload.entityType, 'SimulationScenario');
    assert.equal(ev.payload.entityId, scenarioId);
    assert.deepEqual(ev.payload.diff, { name: 'test' });
  });

  it('unlock event records reason', async function () {
    const ev = await audit({
      tenantId: tenant.id,
      actorId: 1,
      action: 'simulation:scenario:unlock',
      entityType: 'SimulationScenario',
      entityId: scenarioId,
      reason: 'correction',
    });
    assert.equal(ev.payload.reason, 'correction');
  });

  it('auditHistory returns all events for the entity, newest first', async function () {
    await audit({
      tenantId: tenant.id, actorId: 1, action: 'simulation:entry:create',
      entityType: 'SimulationEntry', entityId: 555,
    });
    const hist = await auditHistory('SimulationScenario', scenarioId);
    assert.ok(hist.length >= 2, `expected >=2 scenario events, got ${hist.length}`);
    // all returned rows belong to the scenario
    for (const ev of hist) {
      assert.equal(ev.payload.entityType, 'SimulationScenario');
      assert.equal(String(ev.payload.entityId), String(scenarioId));
    }
    // newest first
    for (let i = 1; i < hist.length; i++) {
      assert.ok(new Date(hist[i - 1].createdAt) >= new Date(hist[i].createdAt));
    }
  });
});
