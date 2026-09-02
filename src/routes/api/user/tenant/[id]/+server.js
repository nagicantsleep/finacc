import { json } from '@sveltejs/kit';
import { updateUserTenant, deleteUserTenant } from '$lib/server/auth/user-session-api.js';

export async function PUT({ locals, params, request }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await updateUserTenant(locals.user, params.id, body);
  return json(result.payload, { status: result.status });
}

export async function DELETE({ locals, params, cookies }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const result = await deleteUserTenant(cookies, locals.user, params.id);
  return json(result.payload, { status: result.status });
}
