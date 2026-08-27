import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'DESC']]
  });
  if (fiscalYears.length === 0) throw redirect(303, '/setup');

  const term = parseInt(url.searchParams.get('term') || locals.term || fiscalYears[0].term.toString(), 10);
  const slips = await models.CrossSlip.findAll({
    where: { tenantId: locals.tenantId, term },
    include: [{ model: models.CrossSlipDetail, as: 'lines' }],
    order: [['year', 'DESC'], ['month', 'DESC'], ['day', 'DESC'], ['no', 'DESC']]
  });

  const accounts = await models.Account.findAll({ where: { tenantId: locals.tenantId } });
  const accountMap = {};
  accounts.forEach((a) => {
    accountMap[a.accountCode] = a.name;
    accountMap[a.id] = a.name;
  });

  return {
    term,
    fiscalYears: fiscalYears.map((f) => ({ term: f.term, year: f.year })),
    slips: slips.map((s) => ({
      id: s.id,
      slipNo: s.no,
      date: `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`,
      lines: (s.lines || []).map((l) => ({
        debitAccountName: accountMap[l.debitAccount] || `科目#${l.debitAccount}`,
        creditAccountName: accountMap[l.creditAccount] || `科目#${l.creditAccount}`,
        debitAmount: l.debitAmount,
        creditAmount: l.creditAmount,
        application: l.application1 || l.application2 || ''
      }))
    }))
  };
}
