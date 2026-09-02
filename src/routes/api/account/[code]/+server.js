import { json } from '@sveltejs/kit';
import { getAccountByCode } from '$lib/server/accounting/chart-accounts.js';

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await getAccountByCode(locals.tenantId, params.code);
  return json(account);
}
