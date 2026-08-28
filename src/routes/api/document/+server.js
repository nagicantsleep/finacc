import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument
} from '$lib/server/master/document-api.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return json(await listDocuments(locals.tenantId));
}

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    return json(await createDocument(locals.tenantId, body));
  } catch {
    return json({ code: -1 });
  }
}

export async function PUT({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateDocument(locals.tenantId, body.id, body);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function DELETE({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await deleteDocument(locals.tenantId, body.id);
    if (!result.ok) return json(result.payload, { status: result.status || 200 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}
