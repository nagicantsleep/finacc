import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { executeClosing } from '$lib/server/accounting/closing-api.js';

export async function POST({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const term = parseInt(params.term, 10);
  if (Number.isNaN(term)) {
    return json({ result: 'NG', message: 'invalid term' }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await executeClosing(locals.tenantId, locals.user, term, body.plResetAcknowledged);
  return json(result.payload, { status: result.status });
}
