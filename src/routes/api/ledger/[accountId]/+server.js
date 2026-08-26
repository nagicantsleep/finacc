import { json } from '@sveltejs/kit';
import { getAccountLedger } from '$lib/server/accounting/ledger.js';

export async function GET({ params, locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const accountCode = parseInt(params.accountId, 10);
  const term = parseInt(url.searchParams.get('term') || locals.term || '1', 10);
  const subAccountCode = url.searchParams.get('subAccount') ? parseInt(url.searchParams.get('subAccount'), 10) : null;

  try {
    const data = await getAccountLedger(locals.tenantId, term, accountCode, subAccountCode);
    return json({ result: 'OK', ...data });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 500 });
  }
}
