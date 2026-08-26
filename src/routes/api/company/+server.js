import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const companies = await models.Company.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.CompanyClass, as: 'companyClass' }],
    order: [['code', 'ASC']]
  });

  return json({ result: 'OK', companies });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const company = await models.Company.create({
      tenantId: locals.tenantId,
      code: body.code,
      name: body.name,
      officialName: body.officialName || body.name,
      nameKana: body.nameKana || '',
      companyClassId: body.companyClassId,
      isClient: Boolean(body.isClient)
    });
    return json({ result: 'OK', company });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
