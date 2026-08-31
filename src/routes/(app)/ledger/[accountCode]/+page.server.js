import { loadLedgerPage } from '$lib/server/accounting/ledger-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
  return loadLedgerPage(event);
}
