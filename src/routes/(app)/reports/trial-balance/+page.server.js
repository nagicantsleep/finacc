import { redirect } from '@sveltejs/kit';
import { calculateTrialBalance } from '$lib/server/accounting/trialBalance.js';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'DESC']]
  });

  if (fiscalYears.length === 0) throw redirect(303, '/setup');

  const term = parseInt(url.searchParams.get('term') || locals.term || fiscalYears[0].term.toString(), 10);
  const data = await calculateTrialBalance(locals.tenantId, term);

  return {
    term,
    fiscalYears: fiscalYears.map((f) => ({ term: f.term, year: f.year })),
    ...data
  };
}
