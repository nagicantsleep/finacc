import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const values = await models.TransactionKind.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  return json({ result: 'OK', values });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = await models.TransactionKind.create({
      tenantId: locals.tenantId,
      label: body.label || '',
      displayOrder: body.displayOrder || 1,
      hasDetails: Boolean(body.hasDetails),
      hasDocument: body.hasDocument ?? 1,
      forCustomer: Boolean(body.forCustomer),
      bookId: body.bookId || null
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
    const item = await models.TransactionKind.findOne({
      where: { id: body.id, tenantId: locals.tenantId }
    });
    if (!item) return json({ result: 'NG', message: 'Not found' }, { status: 404 });

    await item.update(body);
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
    await models.TransactionKind.destroy({
      where: { id: body.id, tenantId: locals.tenantId }
    });
    return json({ result: 'OK' });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
