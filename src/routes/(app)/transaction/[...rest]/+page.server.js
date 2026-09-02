import { error, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import {
  loadTransactionPageData,
  parseTransactionView,
  transactionFiltersFromSearchParams
} from '$lib/server/master/transaction-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, params, depends }) {
  depends('app:transaction');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { viewState, entryId } = parseTransactionView(params.rest);
  if (!viewState || (viewState === 'entry' && !entryId)) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  const filters = transactionFiltersFromSearchParams(url.searchParams);
  const pageData = await loadTransactionPageData({
    tenantId: locals.tenantId,
    viewState,
    entryId,
    filters
  });

  if (viewState === 'entry' && !pageData.selectedTransaction) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return {
    ...pageData,
    viewState,
    filters
  };
}
