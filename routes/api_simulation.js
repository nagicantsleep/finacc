/**
 * Simulation API — Issue #230 (E2.2).
 *
 * Scenario CRUD + state transitions (lock / unlock / archive / clone).
 * Virtual entries (CRUD) is added in 2.3; reports in 2.4/2.5.
 *
 * Tenant scoping: every query uses req.currentTenantId. Cross-tenant
 * access returns 404 to avoid leaking existence.
 */

import express from 'express';
import models from '../models/index.js';
import { is_authenticated } from '../libs/user.js';
import { requireTenant } from '../libs/tenant.js';
import {
  listScenarios,
  createScenario,
  getScenario,
  updateScenario,
  lockScenario,
  unlockScenario,
  archiveScenario,
  cloneScenario,
} from '../libs/simulation/scenario-service.js';

const router = express.Router();

router.use(is_authenticated, requireTenant);

function notFound(res, msg = 'scenario not found') {
  return res.status(404).json({ result: 'NG', code: 'NOT_FOUND', message: msg });
}

function badRequest(res, msg) {
  return res.status(400).json({ result: 'NG', code: 'BAD_REQUEST', message: msg });
}

function conflict(res, msg) {
  return res.status(409).json({ result: 'NG', code: 'CONFLICT', message: msg });
}

function forbidden(res, msg) {
  return res.status(403).json({ result: 'NG', code: 'FORBIDDEN', message: msg });
}

function getActor(req) {
  return req.session && req.session.user ? req.session.user : null;
}

function isAdminOrAccountant(actor) {
  if (!actor) return false;
  return actor.administrable === true || actor.accounting === true;
}

function isAdmin(actor) {
  return !!actor && actor.administrable === true;
}

router.get('/simulation/scenarios', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const filters = {
      status: req.query.status,
      ownerId: req.query.ownerId ? parseInt(req.query.ownerId, 10) : undefined,
      from: req.query.from,
      to: req.query.to,
    };
    const rows = await listScenarios(tenantId, filters);
    res.json({ result: 'OK', scenarios: rows });
  } catch (err) { next(err); }
});

router.post('/simulation/scenarios', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdminOrAccountant(actor)) {
      return forbidden(res, 'create requires admin or accountant role');
    }
    const result = await createScenario(tenantId, actor.id, req.body || {});
    if (result.error) return badRequest(res, result.error);
    await models.AuditEvent.create({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:create',
      payload: { entityType: 'SimulationScenario', entityId: result.id, name: result.name },
    });
    res.status(201).json({ result: 'OK', scenario: result });
  } catch (err) { next(err); }
});

router.get('/simulation/scenarios/:id', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const s = await getScenario(tenantId, id);
    if (!s) return notFound(res);
    res.json({ result: 'OK', scenario: s });
  } catch (err) { next(err); }
});

router.patch('/simulation/scenarios/:id', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdminOrAccountant(actor)) {
      return forbidden(res, 'update requires admin or accountant role');
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const result = await updateScenario(tenantId, id, req.body || {});
    if (result.code === 404) return notFound(res);
    if (result.code === 409) return conflict(res, result.error);
    if (result.error) return badRequest(res, result.error);
    await models.AuditEvent.create({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:update',
      payload: { entityType: 'SimulationScenario', entityId: id, diff: req.body || {} },
    });
    res.json({ result: 'OK', scenario: result.scenario });
  } catch (err) { next(err); }
});

router.post('/simulation/scenarios/:id/lock', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdminOrAccountant(actor)) return forbidden(res, 'lock requires admin or accountant role');
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const result = await lockScenario(tenantId, actor.id, id);
    if (result.code === 404) return notFound(res);
    if (result.code === 409) return conflict(res, result.error);
    await models.AuditEvent.create({
      tenantId, actorId: actor.id, action: 'simulation:scenario:lock',
      payload: { entityType: 'SimulationScenario', entityId: id },
    });
    res.json({ result: 'OK', scenario: result.scenario });
  } catch (err) { next(err); }
});

router.post('/simulation/scenarios/:id/unlock', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdmin(actor)) return forbidden(res, 'unlock requires admin role');
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const result = await unlockScenario(tenantId, id, req.body && req.body.reason);
    if (result.code === 404) return notFound(res);
    if (result.code === 409) return conflict(res, result.error);
    if (result.code === 400) return badRequest(res, result.error);
    await models.AuditEvent.create({
      tenantId, actorId: actor.id, action: 'simulation:scenario:unlock',
      payload: { entityType: 'SimulationScenario', entityId: id, reason: result.reason },
    });
    res.json({ result: 'OK', scenario: result.scenario });
  } catch (err) { next(err); }
});

router.post('/simulation/scenarios/:id/archive', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdminOrAccountant(actor)) return forbidden(res, 'archive requires admin or accountant role');
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const result = await archiveScenario(tenantId, id);
    if (result.code === 404) return notFound(res);
    await models.AuditEvent.create({
      tenantId, actorId: actor.id, action: 'simulation:scenario:archive',
      payload: { entityType: 'SimulationScenario', entityId: id },
    });
    res.json({ result: 'OK', scenario: result.scenario });
  } catch (err) { next(err); }
});

router.post('/simulation/scenarios/:id/clone', async (req, res, next) => {
  try {
    const tenantId = req.currentTenantId;
    const actor = getActor(req);
    if (!isAdminOrAccountant(actor)) return forbidden(res, 'clone requires admin or accountant role');
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return badRequest(res, 'invalid id');
    const newName = req.body && req.body.name;
    const result = await cloneScenario(tenantId, actor.id, id, newName);
    if (result.code === 404) return notFound(res);
    if (result.error) return badRequest(res, result.error);
    await models.AuditEvent.create({
      tenantId, actorId: actor.id, action: 'simulation:scenario:clone',
      payload: { entityType: 'SimulationScenario', sourceId: id, newId: result.scenario.id, entryCount: result.entryCount },
    });
    res.status(201).json({ result: 'OK', scenario: result.scenario, entryCount: result.entryCount });
  } catch (err) { next(err); }
});

export default router;
