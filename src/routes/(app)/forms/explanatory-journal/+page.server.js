import { redirect } from '@sveltejs/kit';
import { loadJournalForm, resolveTerm } from '$lib/server/form-data.js';

export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');
  const term = resolveTerm(url, locals);
  return loadJournalForm(term, locals.tenantId);
}
