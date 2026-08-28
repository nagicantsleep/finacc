import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { requireTenant } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const members = await models.TenantMember.findAll({
    where: {
      tenantId: locals.tenantId,
      userId: { [Op.ne]: null }
    },
    order: [['tradingName', 'ASC']],
    include: [{ model: models.User, as: 'user' }]
  });
  const users = [];
  for (const member of members) {
    if (member.userId) {
      users.push({
        id: member.userId,
        name: member.tradingName || member.user?.legalName || null
      });
    }
  }
  return json({ users });
}
