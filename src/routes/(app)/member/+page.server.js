import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const members = await models.TenantMember.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] }],
    order: [['createdAt', 'ASC']]
  });

  const memberUserIds = members.map((m) => m.userId).filter(Boolean);
  const users = await models.User.findAll({
    where: memberUserIds.length > 0 ? { id: { [models.Sequelize.Op.notIn]: memberUserIds } } : {},
    attributes: ['id', 'name', 'legalName', 'email'],
    order: [['name', 'ASC']]
  });

  const classes = await models.MemberClass.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    members: asJson(members),
    users: asJson(users),
    classes: asJson(classes)
  };
}
