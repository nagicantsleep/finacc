import models from '$lib/server/db/index.js';

export async function listChartAccounts(tenantId) {
  const accounts = await models.Account.findAll({
    where: { tenantId },
    include: [{ model: models.SubAccount, as: 'subAccounts' }],
    order: [['accountCode', 'ASC']]
  });

  return accounts.map((a) => ({
    id: a.id,
    code: a.accountCode,
    name: a.name,
    nameEn: a.nameEn,
    nameVi: a.nameVi,
    taxClass: a.taxClass,
    dc: a.dc,
    subAccounts: (a.subAccounts || []).map((s) => ({
      id: s.id,
      code: s.subAccountCode,
      name: s.name,
      nameEn: s.nameEn,
      nameVi: s.nameVi
    }))
  }));
}
