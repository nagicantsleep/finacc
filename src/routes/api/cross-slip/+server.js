import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import * as taxcalc from '$lib/server/tax-calc.js';
import {
  createCrossSlip,
  updateCrossSlip,
  listNotApproved
} from '$lib/server/accounting/crossSlip.js';
import models from '$lib/server/db/index.js';

async function recalcReject(body, tenantId) {
  const year = parseInt(body.year, 10);
  const month = parseInt(body.month, 10);
  const day = parseInt(body.day, 10);
  const dayErr = taxcalc.validateDay(year, month, day);
  if (dayErr) {
    return { error: json({ code: -2, message: dayErr }, { status: 422 }) };
  }
  const ctx = await taxcalc.loadTaxContext(year, month, tenantId);
  if (!ctx.fy) {
    return { error: json({ code: -2, message: 'date error' }, { status: 422 }) };
  }
  const lines = taxcalc.recalcSlipLines(body.lines, ctx);
  const err = taxcalc.validateLines(lines, ctx) || taxcalc.validateBalanced(lines);
  if (err) {
    return { error: json({ code: -2, message: err }, { status: 422 }) };
  }
  return { body: { ...body, lines, term: ctx.fy.term } };
}

export async function GET({ locals, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const term = parseInt(url.searchParams.get('term') || locals.term || '', 10);
  const slips = await models.CrossSlip.findAll({
    where: {
      tenantId: locals.tenantId,
      ...(Number.isNaN(term) ? {} : { term })
    },
    include: [{ model: models.CrossSlipDetail, as: 'lines' }],
    order: [['year', 'DESC'], ['month', 'DESC'], ['day', 'DESC'], ['no', 'DESC']]
  });
  return json({ result: 'OK', slips });
}

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const raw = await request.json().catch(() => ({}));
  const checked = await recalcReject(raw, locals.tenantId);
  if (checked.error) return checked.error;
  try {
    const slip = await createCrossSlip(checked.body, locals.user, locals.tenantId);
    return json(slip);
  } catch (e) {
    return json({ code: -2, message: e.message || 'date error' }, { status: 422 });
  }
}

export async function PUT({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const raw = await request.json().catch(() => ({}));
  const checked = await recalcReject(raw, locals.tenantId);
  if (checked.error) return checked.error;
  const body = checked.body;
  const slip = await models.CrossSlip.findOne({
    where: { tenantId: locals.tenantId, year: body.year, month: body.month, no: body.no }
  });
  if (!slip) return json({ code: -1, message: 'record not found' }, { status: 404 });
  if (slip.approvedAt) {
    return json({ code: -2, message: 'this slip was approved' }, { status: 422 });
  }
  if (!locals.user.accounting && locals.user.id != slip.createdBy) {
    return json({ code: -10, message: 'permission denied' }, { status: 403 });
  }
  await updateCrossSlip(slip, body, locals.user, locals.tenantId);
  return json({ code: 0 });
}

export async function DELETE({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  if (!locals.user.approvable) {
    return json({ code: -10, message: 'this account can not delete' });
  }
  const body = await request.json().catch(() => ({}));
  const slip = await models.CrossSlip.findOne({
    where: {
      tenantId: locals.tenantId,
      year: body.year,
      month: body.month,
      day: body.day,
      no: body.no
    }
  });
  if (!slip) return json({ code: -1, message: 'record not found' });
  if (slip.approvedAt) {
    return json({ code: -2, message: 'thid slip was approved' });
  }
  await slip.destroy();
  return json({ code: 0 });
}
