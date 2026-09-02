import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
const Op = models.Sequelize.Op;

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const idOrTerm = parseInt(params.id, 10);
  if (isNaN(idOrTerm)) {
    return json({}, { status: 404 });
  }

  const fy = await models.FiscalYear.findOne({
    where: {
      tenantId: locals.tenantId,
      [Op.or]: [
        { term: idOrTerm },
        { id: idOrTerm }
      ]
    }
  });

  return json(fy || {});
}

export async function PUT({ params, request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  const body = await request.json();

  const fy = await models.FiscalYear.findOne({
    where: { id, tenantId: locals.tenantId }
  });

  if (!fy) {
    return json({ result: 'NG', message: 'Not found' }, { status: 404 });
  }

  await fy.update({
    taxIncluded: Boolean(body.taxIncluded)
  });

  return json({ result: 'OK', term: fy });
}
