import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getLabelAccounts, updateLabelAccounts } from '$lib/server/master/label-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await getLabelAccounts(locals.tenantId, params.id);
  if (!result.ok) return json(result.payload, { status: result.status || 404 });
  return json(result.payload);
}

export async function PUT({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateLabelAccounts(locals.tenantId, params.id, body.accounts);
    if (!result.ok) return json(result.payload, { status: result.status || 404 });
    return new Response(null, { status: 200 });
  } catch {
    return json({ code: -1 });
  }
}
