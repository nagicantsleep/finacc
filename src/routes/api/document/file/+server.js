import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { deleteDocumentFile } from '$lib/server/master/document-api.js';

export async function DELETE({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await deleteDocumentFile(locals.tenantId, body.id);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}
