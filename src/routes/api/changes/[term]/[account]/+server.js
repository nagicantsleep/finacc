import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getChanges } from '$lib/server/master/changes-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return json(await getChanges(locals.tenantId, params.term, params.account));
}
