import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const items = await models.Item.findAll({
    where: { tenantId: locals.tenantId },
    order: [['code', 'ASC']]
  });

  return json({ result: 'OK', items });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await models.Item.create({
      tenantId: locals.tenantId,
      code: body.code,
      name: body.name,
      price: body.price || 0,
      unit: body.unit || '',
      taxClass: body.taxClass || 1
    });
    return json({ result: 'OK', item });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
