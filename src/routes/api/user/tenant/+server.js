import { json } from '@sveltejs/kit';
import { createUserTenant } from '$lib/server/auth/user-session-api.js';

export async function POST({ locals, request }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await createUserTenant(locals.user, body);
  return json(result.payload, { status: result.status });
}
