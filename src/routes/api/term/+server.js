import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json([], { status: 401 });
  }

  const terms = await models.FiscalYear.findAll({
    where: { tenantId: locals.tenantId },
    order: [['term', 'ASC']]
  });

  return json(terms.map((t) => ({
    id: t.id,
    term: t.term,
    startDate: t.startDate,
    endDate: t.endDate,
    taxIncluded: Boolean(t.taxIncluded)
  })));
}
