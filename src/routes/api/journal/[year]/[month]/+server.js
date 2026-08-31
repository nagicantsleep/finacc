import { json } from '@sveltejs/kit';
import { getJournalMonth } from '$lib/server/accounting/journal-read.js';

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  let year = parseInt(params.year, 10);
  let month = parseInt(params.month, 10);
  if (isNaN(year) || isNaN(month)) {
    const now = new Date();
    year = isNaN(year) ? now.getFullYear() : year;
    month = isNaN(month) ? now.getMonth() + 1 : month;
  }

  const journal = await getJournalMonth(locals.tenantId, year, month);
  return json({
    result: 'OK',
    journal
  });
}
