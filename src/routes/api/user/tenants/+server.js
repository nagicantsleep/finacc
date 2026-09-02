import { json } from '@sveltejs/kit';
import { listTenants } from '$lib/server/auth/user-session-api.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ result: 'NG', message: '認証されていません。' }, { status: 401 });
  }
  const result = await listTenants(locals.user, locals.tenantId);
  return json(result.payload, { status: result.status });
}
