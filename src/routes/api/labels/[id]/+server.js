import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { updateLabel, deleteLabel } from '$lib/server/master/label-api.js';

export async function PUT({ locals, params, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await updateLabel(locals.tenantId, params.id, body);
    if (!result.ok) return json(result.payload, { status: result.status || 404 });
    return json(result.payload);
  } catch {
    return json({ code: -1 });
  }
}

export async function DELETE({ locals, params }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await deleteLabel(locals.tenantId, params.id);
  if (!result.ok) return json(result.payload, { status: result.status || 404 });
  return new Response(null, { status: 204 });
}
