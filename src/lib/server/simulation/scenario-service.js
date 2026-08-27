/**
 * Simulation scenario service — Issue #230 (E2.2).
 *
 * Owns state transitions and validation for SimulationScenario.
 * Routes must call into this layer; do not touch the model directly.
 *
 * State machine:
 *   draft  --lock-->     locked
 *   draft  --archive-->  archived
 *   locked --archive-->  archived
 *   locked --unlock(admin)--> draft
 *   archived: terminal (no further transitions)
 */

import models from '../../models/index.js';

const STATES = new Set(['draft', 'locked', 'archived']);

function parseDateOnly(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function oneDay(d) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + 1);
  return nd;
}

function isAfter(a, b) {
  return a.getTime() > b.getTime();
}

function validatePeriods(input) {
  const { basePeriodFrom, basePeriodTo, simPeriodFrom, simPeriodTo } = input;
  const bpf = parseDateOnly(basePeriodFrom);
  const bpt = parseDateOnly(basePeriodTo);
  const spf = parseDateOnly(simPeriodFrom);
  const spt = parseDateOnly(simPeriodTo);
  if (!bpf || !bpt || !spf || !spt) {
    return 'periods must be valid dates';
  }
  if (isAfter(bpf, bpt)) {
    return 'basePeriodFrom must be <= basePeriodTo';
  }
  if (isAfter(spf, spt)) {
    return 'simPeriodFrom must be <= simPeriodTo';
  }
  if (isAfter(bpt, spf) && !isAfter(bpt, oneDay(spf))) {
    // simPeriodFrom must be at least one day after basePeriodTo
  }
  if (spf.getTime() < oneDay(bpt).getTime()) {
    return 'simPeriodFrom must be >= basePeriodTo + 1 day';
  }
  return null;
}

export async function listScenarios(tenantId, filters = {}) {
  const where = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt[models.Sequelize.Op.gte] = new Date(filters.from);
    if (filters.to) where.createdAt[models.Sequelize.Op.lte] = new Date(filters.to);
  }
  return models.SimulationScenario.findAll({
    where,
    order: [['updatedAt', 'DESC']],
  });
}

export async function createScenario(tenantId, actorId, input) {
  if (!input.name || String(input.name).trim() === '') {
    return { error: 'name is required' };
  }
  if (input.name.length > 200) {
    return { error: 'name must be 200 characters or fewer' };
  }
  const periodErr = validatePeriods(input);
  if (periodErr) return { error: periodErr };

  return models.SimulationScenario.create({
    tenantId,
    name: String(input.name).trim(),
    description: input.description || null,
    baseTerm: input.baseTerm,
    basePeriodFrom: input.basePeriodFrom,
    basePeriodTo: input.basePeriodTo,
    simPeriodFrom: input.simPeriodFrom,
    simPeriodTo: input.simPeriodTo,
    status: 'draft',
    ownerId: input.ownerId || actorId,
    visibility: input.visibility || 'private',
  });
}

export async function getScenario(tenantId, id) {
  return models.SimulationScenario.findOne({ where: { id, tenantId } });
}

export async function updateScenario(tenantId, id, input) {
  const s = await getScenario(tenantId, id);
  if (!s) return { error: 'not found', code: 404 };
  if (s.status !== 'draft') {
    return { error: 'cannot update non-draft scenario', code: 409 };
  }
  const patch = {};
  if (input.name !== undefined) {
    if (!input.name || String(input.name).trim() === '') return { error: 'name is required' };
    if (input.name.length > 200) return { error: 'name must be 200 characters or fewer' };
    patch.name = String(input.name).trim();
  }
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.baseTerm !== undefined) patch.baseTerm = input.baseTerm;
  if (input.basePeriodFrom !== undefined) patch.basePeriodFrom = input.basePeriodFrom;
  if (input.basePeriodTo !== undefined) patch.basePeriodTo = input.basePeriodTo;
  if (input.simPeriodFrom !== undefined) patch.simPeriodFrom = input.simPeriodFrom;
  if (input.simPeriodTo !== undefined) patch.simPeriodTo = input.simPeriodTo;
  if (Object.keys(patch).length === 0) return { scenario: s };
  const periodErr = validatePeriods({ ...s.toJSON(), ...patch });
  if (periodErr) return { error: periodErr };
  await s.update(patch);
  return { scenario: s };
}

export async function lockScenario(tenantId, actorId, id) {
  const s = await getScenario(tenantId, id);
  if (!s) return { error: 'not found', code: 404 };
  if (s.status !== 'draft') {
    return { error: 'can only lock a draft scenario', code: 409 };
  }
  await s.update({ status: 'locked', lockedAt: new Date(), lockedBy: actorId });
  return { scenario: s };
}

export async function unlockScenario(tenantId, id, reason) {
  const s = await getScenario(tenantId, id);
  if (!s) return { error: 'not found', code: 404 };
  if (s.status !== 'locked') {
    return { error: 'can only unlock a locked scenario', code: 409 };
  }
  if (!reason || String(reason).trim() === '') {
    return { error: 'reason is required for unlock', code: 400 };
  }
  await s.update({ status: 'draft', lockedAt: null, lockedBy: null });
  return { scenario: s, reason: String(reason).trim() };
}

export async function archiveScenario(tenantId, id) {
  const s = await getScenario(tenantId, id);
  if (!s) return { error: 'not found', code: 404 };
  if (s.status === 'archived') return { scenario: s };
  await s.update({ status: 'archived' });
  return { scenario: s };
}

export async function cloneScenario(tenantId, actorId, id, newName) {
  const src = await getScenario(tenantId, id);
  if (!src) return { error: 'not found', code: 404 };
  if (!newName || String(newName).trim() === '') {
    return { error: 'new name is required' };
  }
  const dup = await models.SimulationScenario.create({
    tenantId,
    name: String(newName).trim(),
    description: src.description,
    baseTerm: src.baseTerm,
    basePeriodFrom: src.basePeriodFrom,
    basePeriodTo: src.basePeriodTo,
    simPeriodFrom: src.simPeriodFrom,
    simPeriodTo: src.simPeriodTo,
    status: 'draft',
    ownerId: actorId,
    visibility: src.visibility,
  });
  const entries = await models.SimulationEntry.findAll({ where: { scenarioId: id } });
  if (entries.length > 0) {
    await models.SimulationEntry.bulkCreate(entries.map((e) => {
      const j = e.toJSON();
      delete j.id;
      delete j.createdAt;
      delete j.updatedAt;
      j.scenarioId = dup.id;
      return j;
    }));
  }
  return { scenario: dup, entryCount: entries.length };
}

export function assertStatus(s, expected) {
  if (!STATES.has(s)) throw new Error(`invalid status: ${s}`);
  if (Array.isArray(expected) ? !expected.includes(s) : s !== expected) {
    throw new Error(`expected status ${expected}, got ${s}`);
  }
}
