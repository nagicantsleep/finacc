import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getRemaining } from '$lib/server/master/remaining-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await getRemaining(locals.tenantId, params.term, params.account, params.subAccount);
  if (!result.ok) return json(result.payload, { status: result.status || 404 });
  return json(result.payload);
}
