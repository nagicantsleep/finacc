import { redirect } from '@sveltejs/kit';
import { getAccountLedger } from '$lib/server/accounting/ledger.js';
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
  const accounts = await models.Account.findAll({
    where: { tenantId: locals.tenantId },
    order: [['accountCode', 'ASC']]
  });

  const accountCode = parseInt(url.searchParams.get('account') || (accounts[0]?.accountCode?.toString() || '1111'), 10);
  const subAccountCode = url.searchParams.get('subAccount') ? parseInt(url.searchParams.get('subAccount'), 10) : null;

  const ledgerData = await getAccountLedger(locals.tenantId, term, accountCode, subAccountCode);

  return {
    term,
    accountCode,
    fiscalYears: fiscalYears.map((f) => ({ term: f.term, year: f.year })),
    accounts: accounts.map((a) => ({ code: a.accountCode, name: a.name })),
    ...ledgerData
  };
}
