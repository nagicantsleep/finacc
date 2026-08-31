import { error } from '@sveltejs/kit';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';
import { fiscalMonthRange, getJournalMonth } from '$lib/server/accounting/journal-read.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, parent, depends }) {
  depends('app:journal');

  const year = parseInt(params.year, 10);
  const month = parseInt(params.month, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw error(400, 'Invalid journal period');
  }

  const { currentFy } = await parent();
  const [journal, accounts] = await Promise.all([
    getJournalMonth(locals.tenantId, year, month),
    listChartAccounts(locals.tenantId)
  ]);

  const dates = fiscalMonthRange(currentFy?.startDate, currentFy?.endDate);
  const months =
    dates.length > 0
      ? dates
      : Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));

  return {
    year,
    month,
    journal,
    accounts,
    dates: months
  };
}
