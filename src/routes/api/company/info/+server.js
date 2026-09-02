import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { getCompanyInfo, putCompanyInfo } from '$lib/server/utils.js';

export async function GET({ locals }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const company = await getCompanyInfo(locals.tenantId);
  return json({ company: company || {} });
}

export async function PUT({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const body = await request.json();
  await putCompanyInfo(body, locals.tenantId);
  return json({ code: 0 });
}
