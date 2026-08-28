import { json } from '@sveltejs/kit';
import { selectUserTenant } from '$lib/server/auth/user-session-api.js';

export async function POST({ locals, request, cookies }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await selectUserTenant(cookies, locals.user, body.tenantId);
  return json(result.payload, { status: result.status });
}
