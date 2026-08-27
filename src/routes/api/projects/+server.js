import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json([], { status: 401 });
  }

  const projects = await models.Project.findAll({
    where: { tenantId: locals.tenantId },
    order: [['id', 'ASC']]
  });

  return json(projects.map((p) => p.toJSON()));
}
