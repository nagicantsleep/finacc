import { json } from '@sveltejs/kit';
import { logoffUser } from '$lib/server/auth/user-session-api.js';

export async function POST({ locals, cookies }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const result = await logoffUser(cookies, locals.user);
  return json(result.payload, { status: result.status });
}
