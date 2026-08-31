import { redirect } from '@sveltejs/kit';
import {
  accountsVariant,
  parseLanguagePair
} from '$lib/server/master/accounts-variant-api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, parent, depends }) {
  depends('app:accounts');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { currentFy } = await parent();
  const term = currentFy?.term;
  const accounts =
    term != null
      ? await accountsVariant('all4', locals.tenantId, term, parseLanguagePair(url, locals))
      : [];

  return { accounts };
}
