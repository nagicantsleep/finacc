import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { listTasks } from '$lib/server/master/task-api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const taskRes = await listTasks(locals.tenantId, {});
  const users = await models.User.findAll({
    attributes: ['id', 'name', 'legalName', 'email'],
    order: [['name', 'ASC']]
  });
  const companies = await models.Company.findAll({
    where: { tenantId: locals.tenantId },
    order: [['name', 'ASC']]
  });
  const taxRules = await models.TaxRule.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC']]
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    tasks: taskRes.tasks || [],
    users: asJson(users),
    companies: asJson(companies),
    taxRules: asJson(taxRules)
  };
}
