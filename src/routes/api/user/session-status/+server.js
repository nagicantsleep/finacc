import { json } from '@sveltejs/kit';
import { getSessionStatus } from '$lib/server/auth/user-session-api.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json(
      { result: 'NG', authenticated: false, message: '認証されていません。' },
      { status: 401 }
    );
  }
  const result = await getSessionStatus(locals.user, locals.tenantId);
  return json(result.payload, { status: result.status });
}
