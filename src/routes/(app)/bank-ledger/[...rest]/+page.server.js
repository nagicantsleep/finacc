import { redirect } from '@sveltejs/kit';
import { loadBankLedgerPageData, parseBankLedgerParams } from '$lib/server/master/bank-ledger-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, depends }) {
  depends('app:bank-ledger');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { accountCode, subAccountCode } = parseBankLedgerParams(params.rest);

  const pageData = await loadBankLedgerPageData({
    tenantId: locals.tenantId,
    accountCode,
    subAccountCode,
    term: locals.term,
    currentFy: locals.currentFy
  });

  return {
    ...pageData,
    user: locals.user,
    tenant: locals.tenant
  };
}
