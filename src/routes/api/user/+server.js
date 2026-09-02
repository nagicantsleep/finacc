import { json } from '@sveltejs/kit';
import { currentUserPayload } from '$lib/server/auth/user-session-api.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }
  return json({ result: 'OK', ...currentUserPayload(locals.user) });
}
