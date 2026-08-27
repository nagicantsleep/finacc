import { fail, redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { createCrossSlip } from '$lib/server/accounting/crossSlip.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const accounts = await models.Account.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.SubAccount, as: 'subAccounts' }],
    order: [['accountCode', 'ASC']]
  });

  const taxRules = await models.TaxRule.findAll({
    where: { tenantId: locals.tenantId },
    order: [['displayOrder', 'ASC'], ['id', 'ASC']]
  });

  const now = new Date();
  return {
    accounts: accounts.map((a) => ({
      id: a.id,
      code: a.accountCode,
      name: a.name,
      subAccounts: (a.subAccounts || []).map((s) => ({
        id: s.id,
        code: s.subAccountCode,
        name: s.name
      }))
    })),
    taxRules: taxRules.map((t) => t.toJSON()),
    currentFy: locals.currentFy ? {
      term: locals.currentFy.term,
      startDate: new Date(locals.currentFy.startDate),
      endDate: new Date(locals.currentFy.endDate),
      taxIncluded: Boolean(locals.currentFy.taxIncluded)
    } : {
      term: 1,
      startDate: new Date(`${now.getFullYear()}-01-01`),
      endDate: new Date(`${now.getFullYear()}-12-31`),
      taxIncluded: false
    }
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !locals.tenantId) throw redirect(303, '/login');

    const data = await request.formData();
    const year = parseInt(data.get('year')?.toString(), 10);
    const month = parseInt(data.get('month')?.toString(), 10);
    const day = parseInt(data.get('day')?.toString(), 10);
    const debitAccount = parseInt(data.get('debitAccount')?.toString(), 10);
    const creditAccount = parseInt(data.get('creditAccount')?.toString(), 10);
    const amount = parseInt(data.get('amount')?.toString(), 10);
    const application = data.get('application')?.toString() || '';

    if (!year || !month || !day || !debitAccount || !creditAccount || !amount) {
      return fail(400, { error: 'すべての必須項目を入力してください。' });
    }

    try {
      await createCrossSlip(
        {
          year,
          month,
          day,
          lines: [
            {
              debitAccount,
              creditAccount,
              debitAmount: amount,
              creditAmount: amount,
              application1: application
            }
          ]
        },
        locals.user,
        locals.tenantId
      );

      return { success: true };
    } catch (e) {
      return fail(400, { error: e.message || '振替伝票の登録に失敗しました。' });
    }
  }
};
