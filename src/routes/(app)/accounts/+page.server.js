import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy ? {
      term: locals.currentFy.term,
      startDate: locals.currentFy.startDate,
      endDate: locals.currentFy.endDate,
      taxIncluded: Boolean(locals.currentFy.taxIncluded)
    } : { term: 1, startDate: '2026-01-01', endDate: '2026-12-31', taxIncluded: false }
  };
}
