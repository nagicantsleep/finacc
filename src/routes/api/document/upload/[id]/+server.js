import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { uploadDocumentFile } from '$lib/server/master/document-api.js';

export async function POST({ locals, request, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const documentId = parseInt(params.id, 10);
  const form = await request.formData();
  const result = await uploadDocumentFile(
    locals.tenantId,
    Number.isFinite(documentId) ? documentId : null,
    form.get('file')
  );
  if (!result.ok) return json(result.payload, { status: result.status || 200 });
  return json(result.payload);
}
