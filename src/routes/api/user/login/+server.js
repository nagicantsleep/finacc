import { json } from '@sveltejs/kit';
import { loginWithPassword } from '$lib/server/auth/user-session-api.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const result = await loginWithPassword(cookies, body);
  return json(result.payload, { status: result.status });
}
