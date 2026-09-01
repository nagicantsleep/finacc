import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const values = await models.TaxRule.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  return json({ result: 'OK', values, taxRules: values });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = await models.TaxRule.create({
      tenantId: locals.tenantId,
      label: body.label || '',
      displayOrder: body.displayOrder || 1,
      taxClass: parseInt(body.taxClass || 0, 10),
      rate: parseFloat(body.rate || 0),
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null
    });
    return json({ result: 'OK', value: created });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}

export async function PUT({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await models.TaxRule.findOne({
      where: { id: body.id, tenantId: locals.tenantId }
    });
    if (!item) return json({ result: 'NG', message: 'Not found' }, { status: 404 });

    const patch = { ...body };
    delete patch.id;
    delete patch.tenantId;
    await item.update(patch);
    return json({ result: 'OK', value: item });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}

export async function DELETE({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await models.TaxRule.destroy({
      where: { id: body.id, tenantId: locals.tenantId }
    });
    return json({ result: 'OK' });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
