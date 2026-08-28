import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { get_details } from '$lib/server/ledger-details.js';

export async function getTermLedger(tenantId, termParam, account, subAccount) {
  const term = parseInt(termParam, 10);
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
  if (!fy) {
    return { ok: false, status: 404, payload: { error: `Fiscal year not found: term=${term}` } };
  }
  const sub = subAccount != null && subAccount !== '' ? parseInt(subAccount, 10) : undefined;
  const ledger = await get_details(fy, account, sub, tenantId);
  return { ok: true, payload: ledger.map(asJson) };
}
