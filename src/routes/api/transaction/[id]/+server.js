import { json } from '@sveltejs/kit';
import { requireTenant, notFound } from '$lib/server/api-guard.js';
import {
  getTransaction,
  updateTransaction,
  deleteTransaction
} from '$lib/server/master/transaction-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const payload = await getTransaction(locals.tenantId, params.id);
  if (!payload) return notFound();
  return json(payload);
}

export async function PUT({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateTransaction(locals.tenantId, locals.user, body, params.id);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function DELETE({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await deleteTransaction(locals.tenantId, locals.user, params.id);
  if (!result.ok) return json(result.payload, { status: result.status || 200 });
  return json(result.payload);
}
