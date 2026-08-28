import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { previewMenuUrl } from '$lib/server/master/menu-api.js';

export async function GET({ locals, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await previewMenuUrl(url.searchParams.get('url'));
  if (!result.ok) return json(result.payload, { status: result.status || 500 });
  return json(result.payload);
}
