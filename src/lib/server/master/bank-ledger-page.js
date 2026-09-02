import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { get_details } from '$lib/server/ledger-details.js';
import { getRemaining } from '$lib/server/master/remaining-api.js';
import { getAccountByCode, listChartAccounts } from '$lib/server/accounting/chart-accounts.js';
import { ledgerLines } from '$lib/shared/ledger-lines.js';

export const BANK_ACCOUNTS = [
  ['1010000', 'bank_checking_dep'],
  ['1010010', 'bank_savings_dep'],
  ['1010020', 'bank_time_dep'],
  ['1010030', 'bank_fixed_dep']
];

export function parseBankLedgerParams(rest) {
  if (!rest) return { accountCode: BANK_ACCOUNTS[0][0], subAccountCode: undefined };
  const parts = String(rest).split('/').filter(Boolean);
  const accountCode = parts[0] || BANK_ACCOUNTS[0][0];
  const subAccountCode = parts[1] ? parseInt(parts[1], 10) : undefined;
  return { accountCode, subAccountCode };
}

export async function loadBankLedgerPageData({ tenantId, accountCode, subAccountCode, term, currentFy }) {
  const accounts = await listChartAccounts(tenantId);
  const effectiveAccountCode = accountCode || BANK_ACCOUNTS[0][0];
  const accountObj = await getAccountByCode(tenantId, effectiveAccountCode);
  const subAccounts = accountObj?.subAccounts || [];

  let effectiveSubAccount = subAccountCode;
  if (effectiveSubAccount === undefined && subAccounts.length > 0) {
    effectiveSubAccount = subAccounts[0].subAccountCode || subAccounts[0].code;
  }

  let lines = [];
  let remaining = null;
  let details = [];

  const fy = currentFy || (term ? await models.FiscalYear.findOne({ where: { tenantId, term } }) : await models.FiscalYear.findOne({ where: { tenantId }, order: [['term', 'DESC']] }));

  if (effectiveSubAccount && fy) {
    const remResult = await getRemaining(tenantId, fy.term, effectiveAccountCode, effectiveSubAccount);
    if (remResult.ok) {
      remaining = remResult.payload;
    }
    details = await get_details(fy, effectiveAccountCode, effectiveSubAccount, tenantId);
    const ret = ledgerLines(effectiveAccountCode, effectiveSubAccount, remaining, details);
    lines = ret.lines || [];
  }

  return {
    accounts,
    accountCode: effectiveAccountCode,
    subAccountCode: effectiveSubAccount,
    bankList: accountObj,
    lines,
    currentFy: asJson(fy)
  };
}
