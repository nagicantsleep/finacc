import { fail, redirect } from '@sveltejs/kit';
import { signupUser } from '$lib/server/auth/user-session-api.js';

function field(data, name) {
  const value = data.get(name)?.toString()?.trim();
  return value || undefined;
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const username = field(data, 'username');
    const password = data.get('password')?.toString() || '';
    const confirmPassword = data.get('confirmPassword')?.toString() || '';
    const legalName = field(data, 'legalName');
    const email = field(data, 'email');

    const bounce = {
      username,
      legalName,
      email,
      legalRuby: field(data, 'legalRuby') || '',
      birthDate: field(data, 'birthDate') || '',
      legalSex: field(data, 'legalSex') || '',
      telNo: field(data, 'telNo') || '',
      zip: field(data, 'zip') || '',
      address1: field(data, 'address1') || '',
      address2: field(data, 'address2') || ''
    };

    if (password !== confirmPassword) {
      return fail(400, { error: 'パスワードが一致しません。', ...bounce });
    }

    const result = await signupUser({
      user_name: username,
      password,
      legalName,
      email,
      legalRuby: bounce.legalRuby,
      birthDate: bounce.birthDate,
      legalSex: bounce.legalSex,
      telNo: bounce.telNo,
      zip: bounce.zip,
      address1: bounce.address1,
      address2: bounce.address2
    });

    if (result.payload?.result !== 'OK') {
      return fail(400, {
        error: result.payload?.message || 'アカウント作成に失敗しました。',
        ...bounce
      });
    }

    throw redirect(303, '/login?registered=1');
  }
};
