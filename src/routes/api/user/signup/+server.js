import { json } from '@sveltejs/kit';
import { signupUser } from '$lib/server/auth/user-session-api.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const result = await signupUser(body);
  return json(result.payload, { status: result.status });
}
