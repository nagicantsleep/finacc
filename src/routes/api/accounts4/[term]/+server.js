import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json([], { status: 401 });
  }

  const accounts = await models.Account.findAll({
    where: { tenantId: locals.tenantId },
    include: [{ model: models.SubAccount, as: 'subAccounts' }],
    order: [['accountCode', 'ASC']]
  });

  return json(accounts.map((a) => ({
    id: a.id,
    accountCode: a.accountCode,
    name: a.name,
    nameEn: a.nameEn,
    nameVi: a.nameVi,
    taxClass: a.taxClass,
    dc: a.dc,
    subAccounts: (a.subAccounts || []).map((s) => ({
      id: s.id,
      subAccountCode: s.subAccountCode,
      name: s.name,
      nameEn: s.nameEn,
      nameVi: s.nameVi
    }))
  })));
}
