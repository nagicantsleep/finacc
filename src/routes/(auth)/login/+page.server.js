import { fail, redirect } from '@sveltejs/kit';
import { authUser, setSessionCookie, resolveTenant } from '$lib/server/auth/index.js';

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString()?.trim();
    const password = data.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { error: 'ユーザー名とパスワードを入力してください。', username });
    }

    try {
      const user = await authUser(username, password);
      const membership = await resolveTenant(user.id, null);
      const currentTenantId = membership ? membership.tenantId : null;

      setSessionCookie(cookies, {
        userId: user.id,
        currentTenantId: currentTenantId,
        term: null
      });

      if (currentTenantId) {
        throw redirect(303, '/workspace');
      } else {
        throw redirect(303, '/logon');
      }
    } catch (e) {
      if (e?.status === 303) throw e;
      return fail(400, { error: e.message || 'ログインに失敗しました。', username });
    }
  }
};
