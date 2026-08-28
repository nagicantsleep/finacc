import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { audit } from '$lib/server/audit.js';
import {
  hasSimulationPermission,
  canAccessScenario
} from '$lib/server/auth/permissions.js';
import {
  listScenarios,
  createScenario,
  getScenario,
  updateScenario,
  lockScenario,
  unlockScenario,
  archiveScenario,
  cloneScenario
} from '$lib/server/simulation/scenario-service.js';
import {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry
} from '$lib/server/simulation/entry-validator.js';
import { simulatedTrialBalance } from '$lib/server/simulation/trial-balance.js';
import { comparisonReport } from '$lib/server/simulation/comparison.js';
import { buildScenarioExport } from '$lib/server/simulation/export.js';
import {
  listAssumptions,
  createAssumption,
  getAssumption,
  updateAssumption,
  deleteAssumption
} from '$lib/server/simulation/assumption-service.js';
import {
  previewAssumption,
  previewAll,
  regenerate
} from '$lib/server/simulation/assumption-generator.js';
import { simulatedPL } from '$lib/server/simulation/pl-report.js';
import { cashProjection } from '$lib/server/simulation/cash-projection.js';

function notFound(msg = 'scenario not found') {
  return json({ result: 'NG', code: 'NOT_FOUND', message: msg }, { status: 404 });
}
function badRequest(msg) {
  return json({ result: 'NG', code: 'BAD_REQUEST', message: msg }, { status: 400 });
}
function conflict(msg) {
  return json({ result: 'NG', code: 'CONFLICT', message: msg }, { status: 409 });
}
function forbidden(msg) {
  return json({ result: 'NG', code: 'FORBIDDEN', message: msg }, { status: 403 });
}

function serviceResult(result) {
  if (!result) return notFound();
  if (result.code === 404) return notFound(result.error);
  if (result.code === 409) return conflict(result.error);
  if (result.code === 400 || result.error) return badRequest(result.error);
  return null;
}

function parseReportParams(url) {
  return {
    reportType: url.searchParams.get('reportType'),
    month: url.searchParams.get('month'),
    accountClassIds: url.searchParams.get('accountClassIds')
      ? String(url.searchParams.get('accountClassIds')).split(',').map((s) => parseInt(s, 10))
      : [],
    hideZero: url.searchParams.get('hideZero') === 'true',
    languagePair: url.searchParams.get('languagePair')
      ? JSON.parse(url.searchParams.get('languagePair'))
      : null
  };
}

async function handleGet(parts, locals, url) {
  const actor = locals.user;
  const tenantId = locals.tenantId;
  const canView = () => hasSimulationPermission(actor, 'simulation:view');
  const canExport = () => hasSimulationPermission(actor, 'simulation:export');

  if (parts[0] !== 'scenarios') return json({ result: 'NG' }, { status: 404 });

  if (parts.length === 1) {
    if (!canView()) return forbidden('requires simulation:view');
    const filters = {
      status: url.searchParams.get('status'),
      ownerId: url.searchParams.get('ownerId') ? parseInt(url.searchParams.get('ownerId'), 10) : undefined,
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to')
    };
    const rows = await listScenarios(tenantId, filters);
    const visible = rows.filter((s) => canAccessScenario(actor, s, 'simulation:view'));
    return json({ result: 'OK', scenarios: visible });
  }

  const id = parseInt(parts[1], 10);
  if (Number.isNaN(id)) return badRequest('invalid id');

  if (parts.length === 2) {
    if (!canView()) return forbidden('requires simulation:view');
    const s = await getScenario(tenantId, id);
    if (!s || !canAccessScenario(actor, s, 'simulation:view')) return notFound();
    return json({ result: 'OK', scenario: s });
  }

  if (parts[2] === 'entries' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const scenario = await getScenario(tenantId, id);
    if (!scenario || !canAccessScenario(actor, scenario, 'simulation:view')) {
      return notFound('scenario not found');
    }
    const rows = await listEntries(tenantId, id);
    return json({ result: 'OK', entries: rows });
  }

  if (parts[2] === 'trial-balance' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const out = await simulatedTrialBalance(tenantId, id, parseReportParams(url));
    if (out.error) return out.code === 404 ? notFound(out.error) : badRequest(out.error);
    return json({ result: 'OK', ...out.result });
  }

  if (parts[2] === 'comparison' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const out = await comparisonReport(tenantId, id, parseReportParams(url));
    if (out.error) return out.code === 404 ? notFound(out.error) : badRequest(out.error);
    return json({ result: 'OK', ...out.result });
  }

  if (parts[2] === 'export' && parts.length === 3) {
    if (!canExport()) return forbidden('requires simulation:export');
    const type = url.searchParams.get('type') || 'trial-balance';
    if (!['trial-balance', 'comparison', 'full'].includes(type)) {
      return badRequest('type must be trial-balance|comparison|full');
    }
    const actorName = actor.legalName || actor.name || String(actor.id);
    const out = await buildScenarioExport(tenantId, id, type, actorName);
    if (out.error) return out.code === 404 ? notFound(out.error) : badRequest(out.error);
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:export',
      entityType: 'SimulationScenario',
      entityId: id,
      extra: { type }
    });
    return new Response(out.buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${out.fileName}"`
      }
    });
  }

  if (parts[2] === 'assumptions' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const result = await listAssumptions(tenantId, id);
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', assumptions: result.assumptions });
  }

  if (parts[2] === 'assumptions' && parts.length === 4) {
    if (!canView()) return forbidden('requires simulation:view');
    const aid = parseInt(parts[3], 10);
    if (Number.isNaN(aid)) return badRequest('invalid id');
    const result = await getAssumption(tenantId, id, aid);
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', assumption: result.assumption });
  }

  if (parts[2] === 'cash-flow' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const result = await cashProjection(
      tenantId,
      id,
      url.searchParams.get('periodFrom'),
      url.searchParams.get('periodTo')
    );
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', ...result });
  }

  if (parts[2] === 'pl' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const result = await simulatedPL(
      tenantId,
      id,
      url.searchParams.get('periodFrom'),
      url.searchParams.get('periodTo')
    );
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', ...result });
  }

  return json({ result: 'NG' }, { status: 404 });
}

async function handlePost(parts, locals, body) {
  const actor = locals.user;
  const tenantId = locals.tenantId;
  const canCreate = () => hasSimulationPermission(actor, 'simulation:create');
  const canLock = () => hasSimulationPermission(actor, 'simulation:lock');
  const canUnlock = () => hasSimulationPermission(actor, 'simulation:unlock');
  const canView = () => hasSimulationPermission(actor, 'simulation:view');
  const canRegenerate = () => hasSimulationPermission(actor, 'simulation:regenerate');

  if (parts[0] !== 'scenarios') return json({ result: 'NG' }, { status: 404 });

  if (parts.length === 1) {
    if (!canCreate()) return forbidden('create requires admin or accountant role');
    const result = await createScenario(tenantId, actor.id, body || {});
    if (result.error) return badRequest(result.error);
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:create',
      entityType: 'SimulationScenario',
      entityId: result.id,
      extra: { name: result.name }
    });
    return json({ result: 'OK', scenario: result }, { status: 201 });
  }

  const id = parseInt(parts[1], 10);
  if (Number.isNaN(id)) return badRequest('invalid id');

  if (parts[2] === 'lock' && parts.length === 3) {
    if (!canLock()) return forbidden('requires simulation:lock');
    const result = await lockScenario(tenantId, actor.id, id);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:lock',
      entityType: 'SimulationScenario',
      entityId: id
    });
    return json({ result: 'OK', scenario: result.scenario });
  }

  if (parts[2] === 'unlock' && parts.length === 3) {
    if (!canUnlock()) return forbidden('requires simulation:unlock');
    const result = await unlockScenario(tenantId, id, body?.reason);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:unlock',
      entityType: 'SimulationScenario',
      entityId: id,
      reason: result.reason
    });
    return json({ result: 'OK', scenario: result.scenario });
  }

  if (parts[2] === 'archive' && parts.length === 3) {
    if (!canLock()) return forbidden('requires simulation:lock');
    const result = await archiveScenario(tenantId, id);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:archive',
      entityType: 'SimulationScenario',
      entityId: id
    });
    return json({ result: 'OK', scenario: result.scenario });
  }

  if (parts[2] === 'clone' && parts.length === 3) {
    if (!canCreate()) return forbidden('requires simulation:create');
    const result = await cloneScenario(tenantId, actor.id, id, body?.name);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:clone',
      entityType: 'SimulationScenario',
      entityId: result.scenario.id,
      extra: { sourceId: id, entryCount: result.entryCount }
    });
    return json(
      { result: 'OK', scenario: result.scenario, entryCount: result.entryCount },
      { status: 201 }
    );
  }

  if (parts[2] === 'entries' && parts.length === 3) {
    if (!canCreate()) return forbidden('requires simulation:create');
    const result = await createEntry(tenantId, id, body || {});
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:entry:create',
      entityType: 'SimulationEntry',
      entityId: result.id,
      extra: { scenarioId: id }
    });
    return json({ result: 'OK', entry: result }, { status: 201 });
  }

  if (parts[2] === 'assumptions' && parts.length === 3) {
    if (!canCreate()) return forbidden('requires simulation:create');
    const result = await createAssumption(tenantId, id, body || {});
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:assumption:create',
      entityType: 'SimulationAssumption',
      entityId: result.assumption.id,
      extra: { scenarioId: id, type: result.assumption.type }
    });
    return json({ result: 'OK', assumption: result.assumption }, { status: 201 });
  }

  if (parts[2] === 'assumptions' && parts[4] === 'preview' && parts.length === 5) {
    if (!canView()) return forbidden('requires simulation:view');
    const aid = parseInt(parts[3], 10);
    if (Number.isNaN(aid)) return badRequest('invalid id');
    const result = await previewAssumption(tenantId, id, aid);
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', ...result });
  }

  if (parts[2] === 'preview-all' && parts.length === 3) {
    if (!canView()) return forbidden('requires simulation:view');
    const result = await previewAll(tenantId, id);
    const fail = serviceResult(result);
    if (fail) return fail;
    return json({ result: 'OK', ...result });
  }

  if (parts[2] === 'regenerate' && parts.length === 3) {
    if (!canRegenerate()) return forbidden('requires simulation:regenerate');
    const result = await regenerate(tenantId, id);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:regenerate',
      entityType: 'SimulationScenario',
      entityId: id,
      extra: {
        deletedCount: result.deletedCount,
        insertedCount: result.insertedCount,
        assumptionCount: result.assumptionCount
      }
    });
    return json({ result: 'OK', ...result });
  }

  return json({ result: 'NG' }, { status: 404 });
}

async function handlePatch(parts, locals, body) {
  const actor = locals.user;
  const tenantId = locals.tenantId;
  if (!hasSimulationPermission(actor, 'simulation:create')) {
    return forbidden('update requires admin or accountant role');
  }
  if (parts[0] !== 'scenarios') return json({ result: 'NG' }, { status: 404 });
  const id = parseInt(parts[1], 10);
  if (Number.isNaN(id)) return badRequest('invalid id');

  if (parts.length === 2) {
    const result = await updateScenario(tenantId, id, body || {});
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:scenario:update',
      entityType: 'SimulationScenario',
      entityId: id,
      extra: { diff: body || {} }
    });
    return json({ result: 'OK', scenario: result.scenario });
  }

  if (parts[2] === 'entries' && parts.length === 4) {
    const entryId = parseInt(parts[3], 10);
    if (Number.isNaN(entryId)) return badRequest('invalid id');
    const result = await updateEntry(tenantId, id, entryId, body || {});
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:entry:update',
      entityType: 'SimulationEntry',
      entityId: entryId,
      extra: { scenarioId: id, diff: body || {} }
    });
    return json({ result: 'OK', entry: result.entry });
  }

  if (parts[2] === 'assumptions' && parts.length === 4) {
    const aid = parseInt(parts[3], 10);
    if (Number.isNaN(aid)) return badRequest('invalid id');
    const result = await updateAssumption(tenantId, id, aid, body || {});
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:assumption:update',
      entityType: 'SimulationAssumption',
      entityId: aid,
      extra: { scenarioId: id, diff: body || {} }
    });
    return json({ result: 'OK', assumption: result.assumption });
  }

  return json({ result: 'NG' }, { status: 404 });
}

async function handleDelete(parts, locals) {
  const actor = locals.user;
  const tenantId = locals.tenantId;
  if (!hasSimulationPermission(actor, 'simulation:create')) {
    return forbidden('requires simulation:create');
  }
  if (parts[0] !== 'scenarios') return json({ result: 'NG' }, { status: 404 });
  const id = parseInt(parts[1], 10);
  if (Number.isNaN(id)) return badRequest('invalid id');

  if (parts[2] === 'entries' && parts.length === 4) {
    const entryId = parseInt(parts[3], 10);
    if (Number.isNaN(entryId)) return badRequest('invalid id');
    const result = await deleteEntry(tenantId, id, entryId);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:entry:delete',
      entityType: 'SimulationEntry',
      entityId: entryId,
      extra: { scenarioId: id }
    });
    return json({ result: 'OK' });
  }

  if (parts[2] === 'assumptions' && parts.length === 4) {
    const aid = parseInt(parts[3], 10);
    if (Number.isNaN(aid)) return badRequest('invalid id');
    const result = await deleteAssumption(tenantId, id, aid);
    const fail = serviceResult(result);
    if (fail) return fail;
    await audit({
      tenantId,
      actorId: actor.id,
      action: 'simulation:assumption:delete',
      entityType: 'SimulationAssumption',
      entityId: aid,
      extra: { scenarioId: id }
    });
    return json({ result: 'OK' });
  }

  return json({ result: 'NG' }, { status: 404 });
}

function partsFrom(params) {
  const raw = params.path;
  if (!raw) return [];
  return String(raw).split('/').filter(Boolean);
}

export async function GET({ locals, params, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return handleGet(partsFrom(params), locals, url);
}

export async function POST({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  return handlePost(partsFrom(params), locals, body);
}

export async function PATCH({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  return handlePatch(partsFrom(params), locals, body);
}

export async function DELETE({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return handleDelete(partsFrom(params), locals);
}
