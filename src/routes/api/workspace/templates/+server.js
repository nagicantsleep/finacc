import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getWorkspaceTemplates } from '$lib/server/master/menu-api.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const result = await getWorkspaceTemplates(locals.tenantId);
  return json({ workspaces: result.templates, templates: result.templates });
}
