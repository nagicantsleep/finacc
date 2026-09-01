import { redirect } from '@sveltejs/kit';
import { buildConfirmData } from '$lib/server/accounting/closing-api.js';
import { asJson } from '$lib/server/api-guard.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const term = locals.currentFy?.term || 1;
  const confirmData = await buildConfirmData(locals.tenantId, term);

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    term,
    confirmData: asJson(confirmData)
  };
}
