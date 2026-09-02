import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction
} from '$lib/server/master/transaction-api.js';

export async function GET({ locals, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const query = Object.fromEntries(url.searchParams.entries());
  return json(await listTransactions(locals.tenantId, query));
}

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createTransaction(locals.tenantId, locals.user, locals.term, body);
    if (!result.ok) return json(result.payload);
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
    const result = await updateTransaction(locals.tenantId, locals.user, body);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}
