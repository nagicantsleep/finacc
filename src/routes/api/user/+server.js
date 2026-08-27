import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  return json({ result: 'OK', user: locals.user });
}
