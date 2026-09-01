import { json } from '@sveltejs/kit';
import { listProjects } from '$lib/server/master/project-api.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json([], { status: 401 });
  }

  return json(await listProjects(locals.tenantId));
}
