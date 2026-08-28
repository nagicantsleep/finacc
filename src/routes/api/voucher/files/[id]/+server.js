import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getVoucherFiles } from '$lib/server/master/voucher-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const files = await getVoucherFiles(parseInt(params.id, 10), locals.tenantId);
  return json(files);
}
