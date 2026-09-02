import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const definitions = await models.RegistryDefinition.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    definitions: asJson(definitions)
  };
}
