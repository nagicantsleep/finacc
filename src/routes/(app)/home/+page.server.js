import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const tenant = await models.Tenant.findByPk(locals.tenantId);
  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'DESC']]
  });

  if (fiscalYears.length === 0) {
    throw redirect(303, '/setup');
  }

  const currentTerm = locals.term || fiscalYears[0].term;
  const currentFy = fiscalYears.find((f) => f.term === currentTerm) || fiscalYears[0];

  const menus = await models.Menu.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC']]
  });

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
    fiscalYears: fiscalYears.map((f) => ({
      id: f.id,
      term: f.term,
      year: f.year
    })),
    menus: menus.map((m) => ({
      id: m.id,
      title: m.title,
      body: m.body
    }))
  };
}
