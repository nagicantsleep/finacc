import { json } from '@sveltejs/kit';
import { listCompanyClasses } from '$lib/server/accounting/company-list.js';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const values = await listCompanyClasses(locals.tenantId);
  return json({ result: 'OK', values });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = await models.CompanyClass.create({
      tenantId: locals.tenantId,
      name: body.name || '',
      displayOrder: body.displayOrder || 1,
      isClient: Boolean(body.isClient)
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
    const item = await models.CompanyClass.findOne({
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
    await models.CompanyClass.destroy({
      where: { id: body.id, tenantId: locals.tenantId }
    });
    return json({ result: 'OK' });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
