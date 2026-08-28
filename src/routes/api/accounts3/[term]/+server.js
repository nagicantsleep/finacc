import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import { accountsVariant, parseLanguagePair } from '$lib/server/master/accounts-variant-api.js';

export async function GET({ locals, params, url }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  const lines = await accountsVariant('all3', locals.tenantId, params.term, parseLanguagePair(url, locals));
  return json(lines);
}
