import { listChartAccounts, getAccountByCode } from '$lib/server/accounting/chart-accounts.js';
import { getRemaining } from '$lib/server/master/remaining-api.js';
import { getTermLedger } from '$lib/server/master/term-ledger-api.js';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function loadLedgerPage({ params, locals, parent, depends }) {
  depends('app:ledger');

  const { currentFy } = await parent();
  const accountCode = params.accountCode || '1000000';
  const subRaw = params.subAccountCode;
  const subAccountCode = subRaw != null && subRaw !== '' ? parseInt(subRaw, 10) : undefined;
  const term = currentFy?.term;
  const hasSub = Number.isFinite(subAccountCode);

  const [accounts, account, remainingResult, ledgerResult] = await Promise.all([
    listChartAccounts(locals.tenantId),
    getAccountByCode(locals.tenantId, accountCode),
    term
      ? getRemaining(locals.tenantId, term, accountCode, hasSub ? subAccountCode : undefined)
      : Promise.resolve({ ok: false, payload: null }),
    term
      ? getTermLedger(locals.tenantId, term, accountCode, hasSub ? subAccountCode : undefined)
      : Promise.resolve({ ok: true, payload: [] })
  ]);

  return {
    accountCode,
    subAccountCode: hasSub ? subAccountCode : null,
    term: term || null,
    accounts,
    account,
    remaining: remainingResult.ok ? remainingResult.payload : null,
    details: ledgerResult.ok ? ledgerResult.payload : []
  };
}
