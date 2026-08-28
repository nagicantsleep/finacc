import { json } from '@sveltejs/kit';
import { forbidden, requireTenant } from '$lib/server/api-guard.js';
import { getDocumentFileBody } from '$lib/server/master/document-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  if (!locals.user?.accounting) return forbidden();
  const file = await getDocumentFileBody(locals.tenantId, params.id);
  if (!file) return json({ code: -1, message: 'not found' }, { status: 404 });
  return new Response(file.body, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.name || 'file'}"`
    }
  });
}
