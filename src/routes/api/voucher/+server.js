import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import {
  listVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from '$lib/server/master/voucher-api.js';

export async function GET({ locals, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const query = Object.fromEntries(url.searchParams.entries());
  const payload = await listVouchers(locals.tenantId, query, locals.term);
  return json(payload);
}

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createVoucher(locals.tenantId, locals.user.id, body);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function PUT({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateVoucher(locals.tenantId, locals.user, body);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function DELETE({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await deleteVoucher(locals.tenantId, locals.user, body.id);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}
