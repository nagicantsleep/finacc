import { redirect } from '@sveltejs/kit';
import { loadTenantPageData } from '$lib/server/master/tenant-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, depends }) {
  depends('app:tenant');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const pageData = await loadTenantPageData({
    tenantId: locals.tenantId,
    user: locals.user
  });

  return pageData;
}
