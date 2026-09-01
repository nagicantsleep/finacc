import { redirect } from '@sveltejs/kit';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const accounts = await listChartAccounts(locals.tenantId);

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    accounts
  };
}
