import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { hashPassword, setSessionCookie } from '$lib/server/auth/index.js';
import { bootstrapTenantMember } from '$lib/server/auth/bootstrap.js';

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString()?.trim();
    const password = data.get('password')?.toString();
    const email = data.get('email')?.toString()?.trim();
    const legalName = data.get('legalName')?.toString()?.trim() || username;
    const tenantName = data.get('tenantName')?.toString()?.trim() || legalName;

    if (!username || !password || !email) {
      return fail(400, { error: 'ユーザー名、パスワード、メールアドレスは必須です。', username, email, legalName, tenantName });
    }

    const t = await models.sequelize.transaction();
    try {
      const existing = await models.User.findOne({ where: { name: username }, transaction: t });
      if (existing) {
        await t.rollback();
        return fail(400, { error: 'このユーザー名は既に使用されています。', username, email, legalName, tenantName });
      }

      const user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword(password),
          email: email,
          legalName: legalName,
          status: 'active'
        },
        { transaction: t }
      );

      const { tenant } = await bootstrapTenantMember(user, { name: tenantName }, t);

      await t.commit();

      setSessionCookie(cookies, {
        userId: user.id,
        currentTenantId: tenant.id,
        term: null
      });

      throw redirect(303, '/setup');
    } catch (e) {
      if (e?.status === 303) throw e;
      if (!t.finished) await t.rollback();
      return fail(400, { error: e.message || 'アカウント作成に失敗しました。', username, email, legalName, tenantName });
    }
  }
};
