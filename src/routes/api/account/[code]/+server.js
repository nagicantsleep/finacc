import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ params, locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account_code = params.code;
  if (!account_code || account_code === 'undefined') {
    return json({ subAccounts: [] });
  }

  const tenantId = locals.tenantId;

  const account = await models.Account.findOne({
    where: {
      tenantId,
      accountCode: account_code
    },
    include: [{
      model: models.SubAccount,
      as: 'subAccounts',
      where: { tenantId },
      required: false
    }],
    order: [
      [{ model: models.SubAccount, as: 'subAccounts' }, 'subAccountCode', 'ASC']
    ]
  });

  if (!account) {
    return json({ accountCode: account_code, name: '', subAccounts: [] });
  }

  return json(account.toJSON());
}
