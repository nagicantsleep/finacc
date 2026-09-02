import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

export async function listProjects(tenantId) {
  const rows = await models.Project.findAll({
    where: { tenantId },
    order: [['id', 'ASC']]
  });
  return rows.map((row) => asJson(row));
}

export async function getProject(tenantId, id) {
  const row = await models.Project.findOne({
    where: { id, tenantId }
  });
  return row ? asJson(row) : null;
}
