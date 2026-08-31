import { error, fail, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import {
  getCompanyById,
  listCompanies,
  listCompanyClasses,
  parseCompanyView
} from '$lib/server/accounting/company-list.js';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, params, depends }) {
  depends('app:company');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { viewState, entryId, kind } = parseCompanyView(params.rest, url.searchParams);
  if (!viewState || (viewState === 'entry' && !entryId)) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  const [companies, companyClasses, selectedCompany] = await Promise.all([
    viewState === 'list'
      ? listCompanies(locals.tenantId, { kind })
      : Promise.resolve([]),
    listCompanyClasses(locals.tenantId),
    viewState === 'entry'
      ? getCompanyById(locals.tenantId, entryId)
      : Promise.resolve(viewState === 'new' ? {} : null)
  ]);

  if (viewState === 'entry' && !selectedCompany) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return {
    companies,
    companyClasses,
    selectedCompany,
    viewState,
    kind
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || !locals.tenantId) throw redirect(303, '/login');

    const data = await request.formData();
    const name = data.get('name')?.toString()?.trim();
    const chargeName = data.get('chargeName')?.toString()?.trim() || '';
    const companyClassId = parseInt(data.get('companyClassId')?.toString(), 10);

    if (!name || !companyClassId) {
      return fail(400, { error: '取引先名、区分は必須です。' });
    }

    try {
      await models.Company.create({
        tenantId: locals.tenantId,
        name,
        chargeName,
        companyClassId
      });
      return { success: true };
    } catch (e) {
      return fail(400, { error: e.message || '取引先の作成に失敗しました。' });
    }
  }
};
