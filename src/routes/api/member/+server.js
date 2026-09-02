import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const members = await models.TenantMember.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] }],
    order: [['createdAt', 'ASC']]
  });

  return json({ result: 'OK', members });
}
