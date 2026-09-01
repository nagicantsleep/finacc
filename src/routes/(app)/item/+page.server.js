import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const items = await models.Item.findAll({
    where: { tenantId: locals.tenantId },
    include: [
      { model: models.ItemClass, as: 'itemClass' },
      { model: models.Document, as: 'document', include: [{ model: models.DocumentFile, as: 'files' }] }
    ],
    order: [['id', 'ASC']]
  });

  const classes = await models.ItemClass.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  const users = await models.User.findAll({
    attributes: ['id', 'name', 'legalName', 'email'],
    order: [['name', 'ASC']]
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    items: asJson(items),
    classes: asJson(classes),
    users: asJson(users)
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || !locals.tenantId) throw redirect(303, '/login');

    const data = await request.formData();
    const code = data.get('code')?.toString()?.trim() || '';
    const name = data.get('name')?.toString()?.trim();
    const price = parseInt(data.get('price')?.toString() || '0', 10);
    const unit = data.get('unit')?.toString()?.trim() || '個';

    if (!name) {
      return fail(400, { error: '品目名は必須です。' });
    }

    try {
      await models.Item.create({
        tenantId: locals.tenantId,
        localCode: code,
        name,
        standardPrice: price,
        unit,
        taxClass: 1
      });
      return { success: true };
    } catch (e) {
      return fail(400, { error: e.message || '品目の作成に失敗しました。' });
    }
  }
};
