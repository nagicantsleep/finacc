import { error, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import { getSessionData, setSessionCookie } from '$lib/server/auth/index.js';
import { loadHomePageData, parseHomeView } from '$lib/server/master/home-page.js';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, depends, cookies }) {
  depends('app:home');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const parsed = parseHomeView(params.rest);
  if (parsed.action === 'setTerm') {
    const fy = await models.FiscalYear.findOne({
      where: { tenantId: locals.tenantId, term: parsed.term }
    });
    if (!fy) {
      throw error(404, NOT_FOUND_MESSAGE);
    }

    const sessionData = getSessionData(cookies);
    setSessionCookie(cookies, {
      userId: sessionData?.userId || locals.user.id,
      currentTenantId: locals.tenantId,
      term: parsed.term
    });
    throw redirect(303, '/home');
  }
  if (parsed.action === null) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return loadHomePageData({
    tenantId: locals.tenantId,
    user: locals.user,
    term: locals.term
  });
}
