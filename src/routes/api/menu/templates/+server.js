import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getMenuTemplates } from '$lib/server/master/menu-api.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return json(await getMenuTemplates(locals.tenantId));
}
