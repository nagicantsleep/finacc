import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const claims = await models.ExpenseClaim.findAll({
    where: { tenantId: locals.tenantId },
    order: [['claimDate', 'DESC'], ['id', 'DESC']],
    include: [
      { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
      { model: models.Project, as: 'project', attributes: ['id', 'name'] },
      { model: models.ExpenseAdvance, as: 'advance', attributes: ['id', 'code', 'title', 'amount'] },
      { model: models.ExpenseClaimItem, as: 'items', attributes: ['id'] }
    ]
  });

  const categories = await models.ExpenseCategory.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  const advances = await models.ExpenseAdvance.findAll({
    where: { tenantId: locals.tenantId },
    order: [['date', 'DESC'], ['id', 'DESC']]
  });

  const results = claims.map((c) => {
    const plain = c.toJSON();
    plain.itemCount = plain.items ? plain.items.length : 0;
    delete plain.items;
    return plain;
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    claims: asJson(results),
    categories: asJson(categories),
    advances: asJson(advances)
  };
}
