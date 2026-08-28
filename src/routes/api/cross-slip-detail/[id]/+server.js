import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getCrossSlipDetail } from '$lib/server/master/cross-slip-detail-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const row = await getCrossSlipDetail(locals.tenantId, params.id);
  return json(row);
}
