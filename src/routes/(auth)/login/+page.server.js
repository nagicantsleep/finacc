import { fail, redirect } from '@sveltejs/kit';
import { loginWithPassword } from '$lib/server/auth/user-session-api.js';

function parseLanguagePair(raw) {
  if (!raw) return null;
  try {
    const picked = JSON.parse(raw.toString());
    if (picked?.primary && picked?.secondary) return picked;
  } catch {
    // ignore malformed hidden field
  }
  return null;
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  return {
    registered: url.searchParams.get('registered') === '1'
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString()?.trim();
    const password = data.get('password')?.toString();
    const languagePair = parseLanguagePair(data.get('languagePair'));

    if (!username || !password) {
      return fail(400, { error: 'ユーザー名とパスワードを入力してください。', username });
    }

    const result = await loginWithPassword(cookies, {
      username,
      user_name: username,
      password,
      languagePair
    });

    if (result.payload?.result !== 'OK') {
      return fail(400, {
        error: result.payload?.message || 'ログインに失敗しました。',
        username
      });
    }

    if (result.payload.requiresTenantSelection) {
      throw redirect(303, '/logon');
    }
    throw redirect(303, '/workspace');
  }
};
