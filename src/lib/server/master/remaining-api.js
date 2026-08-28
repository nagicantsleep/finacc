import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

export async function getRemaining(tenantId, termParam, account, subAccount) {
  let term = parseInt(termParam, 10);
  if (term === 0) {
    const d = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'ASC']]
    });
    if (!d) return { ok: false, status: 404, payload: { error: `No fiscal year found for tenant ${tenantId}` } };
    term = d.term;
  }

  const accountRec = await models.Account.findOne({
    where: { tenantId, accountCode: account }
  });
  if (!accountRec) {
    return { ok: false, status: 404, payload: { error: `Account not found: ${account}` } };
  }

  if (subAccount) {
    const subRec = await models.SubAccount.findOne({
      where: {
        tenantId,
        accountId: accountRec.id,
        subAccountCode: subAccount
      }
    });
    if (!subRec) {
      return { ok: false, status: 404, payload: { error: `Sub-account not found: ${account}/${subAccount}` } };
    }
    const remaining = await models.SubAccountRemaining.findOne({
      where: { [Op.and]: { tenantId, term, subAccountId: subRec.id } }
    });
    return { ok: true, payload: asJson(remaining) };
  }

  const remaining = await models.AccountRemaining.findOne({
    where: { [Op.and]: { tenantId, term, accountId: accountRec.id } }
  });
  return { ok: true, payload: asJson(remaining) };
}
