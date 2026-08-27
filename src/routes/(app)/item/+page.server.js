import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const items = await models.Item.findAll({
    where: { tenantId: locals.tenantId },
    order: [['code', 'ASC']]
  });

  return {
    items: items.map((i) => ({
      id: i.id,
      code: i.code,
      name: i.name,
      price: i.price,
      unit: i.unit || '',
      taxClass: i.taxClass
    }))
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || !locals.tenantId) throw redirect(303, '/login');

    const data = await request.formData();
    const code = parseInt(data.get('code')?.toString(), 10);
    const name = data.get('name')?.toString()?.trim();
    const price = parseInt(data.get('price')?.toString() || '0', 10);
    const unit = data.get('unit')?.toString()?.trim() || '個';

    if (!code || !name) {
      return fail(400, { error: '品目コードと品目名は必須です。' });
    }

    try {
      await models.Item.create({
        tenantId: locals.tenantId,
        code,
        name,
        price,
        unit,
        taxClass: 1
      });
      return { success: true };
    } catch (e) {
      return fail(400, { error: e.message || '品目の作成に失敗しました。' });
    }
  }
};
