import { json } from '@sveltejs/kit';
import { calculateTrialBalance } from '$lib/server/accounting/trialBalance.js';

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const term = parseInt(url.searchParams.get('term') || locals.term || '1', 10);
  try {
    const data = await calculateTrialBalance(locals.tenantId, term);
    return json({ result: 'OK', ...data });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 500 });
  }
}
