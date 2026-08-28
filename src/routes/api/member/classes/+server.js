import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const values = await models.MemberClass.findAll({
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });
  return json({ values, memberClasses: values, code: 0 });
}
