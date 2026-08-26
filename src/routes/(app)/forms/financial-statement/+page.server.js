import { redirect } from '@sveltejs/kit';
import { calculateTrialBalance } from '$lib/server/accounting/trialBalance.js';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const tenant = await models.Tenant.findByPk(locals.tenantId);
  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'DESC']]
  });
  if (fiscalYears.length === 0) throw redirect(303, '/setup');

  const term = parseInt(url.searchParams.get('term') || locals.term || fiscalYears[0].term.toString(), 10);
  const currentFy = fiscalYears.find((f) => f.term === term) || fiscalYears[0];
  const tb = await calculateTrialBalance(locals.tenantId, term);

  // Group accounts into Assets, Liabilities, Net Assets, Revenue, Expenses
  const bsRows = tb.rows.filter((r) => ['資産', '負債', '純資産'].includes(r.category));
  const plRows = tb.rows.filter((r) => ['売上高', '売上原価', '販売費及び一般管理費', '営業外収益', '営業外費用', '特別利益', '特別損失'].includes(r.category));

  return {
    tenant: {
      name: tenant?.name || 'Hieronymus Corp'
    },
    fy: {
      term: currentFy.term,
      year: currentFy.year,
      startDate: currentFy.startDate,
      endDate: currentFy.endDate
    },
    bsRows,
    plRows: plRows.length > 0 ? plRows : tb.rows,
    totals: tb.totals
  };
}
