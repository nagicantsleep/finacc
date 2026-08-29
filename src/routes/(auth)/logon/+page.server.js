import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { setSessionCookie, clearSessionCookie } from '$lib/server/auth/index.js';
import { seedTenantBase, slugFromName } from '$lib/server/auth/bootstrap.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const memberships = await models.TenantMember.findAll({
    where: { userId: locals.user.id, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }],
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });

  return {
    user: locals.user,
    currentTenantId: locals.tenantId,
    memberships: memberships.map((m) => ({
      tenantId: m.tenantId,
      name: m.tenant?.name || '名称未設定',
      slug: m.tenant?.slug || '',
      role: m.role,
      isOwner: m.isOwner,
      isDefault: m.isDefault
    }))
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  selectTenant: async ({ request, locals, cookies }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const tenantId = data.get('tenantId')?.toString();

    if (!tenantId) {
      return fail(400, { error: 'テナントが選択されていません。' });
    }

    const membership = await models.TenantMember.findOne({
      where: { userId: locals.user.id, tenantId, status: 'active' },
      include: [{ model: models.Tenant, as: 'tenant' }]
    });

    if (!membership || !membership.tenant || membership.tenant.status !== 'active') {
      return fail(403, { error: 'このテナントへのアクセス権がありません。' });
    }

    setSessionCookie(cookies, {
      userId: locals.user.id,
      currentTenantId: tenantId,
      term: null
    });

    throw redirect(303, '/workspace');
  },

  createTenant: async ({ request, locals, cookies }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const name = data.get('name')?.toString()?.trim();
    if (!name) {
      return fail(400, { error: '組織名・会社名は必須です。' });
    }

    const t = await models.sequelize.transaction();
    try {
      const user = await models.User.findByPk(locals.user.id, { transaction: t });
      const slug = slugFromName(name);

      const { tenant } = await seedTenantBase(user, { name, slug, isDefault: false }, t);
      await t.commit();

      setSessionCookie(cookies, {
        userId: locals.user.id,
        currentTenantId: tenant.id,
        term: null
      });

      throw redirect(303, '/setup');
    } catch (e) {
      if (e?.status === 303) throw e;
      if (!t.finished) await t.rollback();
      return fail(400, { error: e.message || 'テナントの作成に失敗しました。' });
    }
  },

  logout: async ({ cookies }) => {
    clearSessionCookie(cookies);
    throw redirect(303, '/login');
  }
};
