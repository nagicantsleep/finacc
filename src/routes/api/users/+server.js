import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { requireTenant } from '$lib/server/api-guard.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const users = await models.User.findAll({
    include: [{
      model: models.TenantMember,
      as: 'memberships',
      where: { tenantId: locals.tenantId, status: 'active' },
      attributes: []
    }],
    order: [['name', 'ASC']]
  });
  return json({ users });
}
