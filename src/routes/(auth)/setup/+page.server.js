import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { executeSetupWizard } from '$lib/server/accounting/setup.js';
import { setSessionCookie } from '$lib/server/auth/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  if (!locals.tenantId) {
    throw redirect(303, '/logon');
  }

  const countFy = await models.FiscalYear.count({ where: { tenantId: locals.tenantId } });
  if (countFy > 0) {
    throw redirect(303, '/workspace');
  }

  const currentYear = new Date().getFullYear();
  return {
    tenantId: locals.tenantId,
    defaultStartDate: `${currentYear}-01-01`,
    defaultEndDate: `${currentYear}-12-31`,
    defaultYear: currentYear,
    defaultTerm: 1
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals, cookies }) => {
    if (!locals.user) throw redirect(303, '/login');
    if (!locals.tenantId) throw redirect(303, '/logon');

    const data = await request.formData();
    const startDate = data.get('startDate')?.toString();
    const endDate = data.get('endDate')?.toString();
    const term = data.get('term')?.toString() || '1';
    const year = data.get('year')?.toString() || new Date(startDate).getFullYear().toString();
    const companyClass = data.get('companyClass')?.toString() || '1';
    const roundingMethod = data.get('roundingMethod')?.toString() || '1';

    if (!startDate || !endDate) {
      return fail(400, { error: '開始日と終了日は必須です。' });
    }

    try {
      const result = await executeSetupWizard(locals.tenantId, {
        startDate,
        endDate,
        term,
        year,
        companyClass,
        roundingMethod
      });

      if (result.success) {
        setSessionCookie(cookies, {
          userId: locals.user.id,
          currentTenantId: locals.tenantId,
          term: parseInt(term, 10)
        });
        throw redirect(303, '/workspace');
      } else {
        return fail(400, { error: result.message || '初期設定に失敗しました。' });
      }
    } catch (e) {
      if (e?.status === 303) throw e;
      return fail(400, { error: e.message || '初期設定中にエラーが発生しました。' });
    }
  }
};
