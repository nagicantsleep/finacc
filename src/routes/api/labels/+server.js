import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { listLabels, createLabel } from '$lib/server/master/label-api.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  return json(await listLabels(locals.tenantId));
}

export async function POST({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  try {
    const body = await request.json();
    const created = await createLabel(locals.tenantId, body);
    return json(created, { status: 201 });
  } catch {
    return json({ code: -1 });
  }
}
