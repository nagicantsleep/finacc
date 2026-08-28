import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { buildConfirmData } from '$lib/server/accounting/closing-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const term = parseInt(params.term, 10);
  if (Number.isNaN(term)) {
    return json({ result: 'NG', message: 'invalid term' }, { status: 400 });
  }
  const data = await buildConfirmData(locals.tenantId, term);
  if (data.error) {
    return json({ result: 'NG', message: data.error }, { status: 404 });
  }
  return json({ result: 'OK', ...data });
}
