import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { listNotApproved } from '$lib/server/accounting/crossSlip.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const slips = await listNotApproved(locals.tenantId, locals.user, locals.term);
  return json(slips);
}
