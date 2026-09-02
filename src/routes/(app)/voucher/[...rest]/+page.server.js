import { error, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import {
  loadVoucherPageData,
  parseVoucherView,
  voucherFiltersFromSearchParams
} from '$lib/server/master/voucher-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, params, parent, depends }) {
  depends('app:voucher');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { currentFy } = await parent();
  const { viewState, entryId } = parseVoucherView(params.rest);
  if (!viewState || (viewState === 'entry' && !entryId)) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  const filters = voucherFiltersFromSearchParams(url.searchParams);
  const pageData = await loadVoucherPageData({
    tenantId: locals.tenantId,
    term: currentFy?.term,
    viewState,
    entryId,
    filters,
    currentFy
  });

  if (viewState === 'entry' && !pageData.selectedVoucher) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return {
    ...pageData,
    viewState,
    filters
  };
}
