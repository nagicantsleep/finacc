import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const companies = await models.Company.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.CompanyClass, as: 'companyClass' }],
    order: [['code', 'ASC']]
  });

  const companyClasses = await models.CompanyClass.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC']]
  });

  return {
    companies: companies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      officialName: c.officialName,
      className: c.companyClass?.name || '未分類'
    })),
    companyClasses: companyClasses.map((cls) => ({
      id: cls.id,
      name: cls.name
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
    const officialName = data.get('officialName')?.toString()?.trim() || name;
    const companyClassId = parseInt(data.get('companyClassId')?.toString(), 10);

    if (!code || !name || !companyClassId) {
      return fail(400, { error: 'コード、取引先名、区分は必須です。' });
    }

    try {
      await models.Company.create({
        tenantId: locals.tenantId,
        code,
        name,
        officialName,
        companyClassId,
        isClient: false
      });
      return { success: true };
    } catch (e) {
      return fail(400, { error: e.message || '取引先の作成に失敗しました。' });
    }
  }
};
