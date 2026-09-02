import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getDocument, updateDocument, deleteDocument } from '$lib/server/master/document-api.js';

export async function GET({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return json(await getDocument(locals.tenantId, params.id));
}

export async function PUT({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateDocument(locals.tenantId, params.id, body);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function DELETE({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await deleteDocument(locals.tenantId, params.id || body.id);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}
