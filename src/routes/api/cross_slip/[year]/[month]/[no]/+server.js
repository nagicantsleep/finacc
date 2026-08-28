import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getCrossSlip } from '$lib/server/accounting/crossSlip.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const slip = await getCrossSlip(locals.tenantId, params.year, params.month, params.no);
  return json(slip);
}
