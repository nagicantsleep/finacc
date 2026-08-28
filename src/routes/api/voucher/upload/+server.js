import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { uploadVoucherFile } from '$lib/server/master/voucher-api.js';

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const form = await request.formData();
  const result = await uploadVoucherFile(locals.tenantId, null, form.get('file'));
  if (!result.ok) return json(result.payload, { status: result.status || 200 });
  return json(result.payload);
}
