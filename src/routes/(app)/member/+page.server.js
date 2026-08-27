import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const members = await models.TenantMember.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.User, as: 'user' }],
    order: [['createdAt', 'ASC']]
  });

  return {
    members: members.map((m) => ({
      id: m.id,
      name: m.user?.name || m.tradingName || '未設定',
      email: m.user?.email || '-',
      legalName: m.user?.legalName || '-',
      isOwner: m.isOwner,
      status: m.status,
      accounting: m.accounting,
      approvable: m.approvable
    }))
  };
}
