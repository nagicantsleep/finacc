import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'DESC']]
  });

  if (fiscalYears.length === 0) {
    throw redirect(303, '/setup');
  }

  const tenant = await models.Tenant.findByPk(locals.tenantId);
  const termParam = url.searchParams.get('term');
  const activeTerm = termParam ? parseInt(termParam, 10) : (locals.term || fiscalYears[0].term);
  const currentFy = fiscalYears.find((f) => f.term === activeTerm) || fiscalYears[0];

  return {
    user: locals.user,
    tenant: {
      id: tenant?.id,
      name: tenant?.name,
      slug: tenant?.slug,
      settings: tenant?.settings || {}
    },
    currentFy: {
      id: currentFy.id,
      term: currentFy.term,
      year: currentFy.year,
      startDate: currentFy.startDate,
      endDate: currentFy.endDate
    },
    company: tenant?.settings && typeof tenant.settings === 'object' ? tenant.settings : {},
    fiscalYears: fiscalYears.map((f) => ({
      id: f.id,
      term: f.term,
      year: f.year
    }))
  };
}
