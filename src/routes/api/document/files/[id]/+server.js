import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getDocumentFiles } from '$lib/server/master/document-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const files = await getDocumentFiles(parseInt(params.id, 10), locals.tenantId);
  return json(files);
}
