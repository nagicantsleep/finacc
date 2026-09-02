import { json } from '@sveltejs/kit';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await listChartAccounts(locals.tenantId);
  return json(accounts);
}
