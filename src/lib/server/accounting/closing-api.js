import models from '$lib/server/db/index.js';
import { field, numeric } from '$lib/server/parse_account_code.js';
import TrialBalance from '$lib/server/trial_balance.js';
import { audit } from '$lib/server/audit.js';
import runYearEndClosing from '$lib/server/accounting/year-end-closing.js';

const Op = models.Sequelize.Op;

export async function buildConfirmData(tenantId, term) {
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
  if (!fy) {
    return { error: `Fiscal year for term ${term} not found.` };
  }
  const nextTerm = term + 1;
  const nfy = await models.FiscalYear.findOne({ where: { tenantId, term: nextTerm } });

  const unapprovedCount = await models.CrossSlip.count({
    where: { tenantId, term, approvedAt: { [Op.eq]: null } }
  });

  const { lines } = await TrialBalance(tenantId, term);
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of lines) {
    if (!l.code) continue;
    totalDebit += numeric(l.debit);
    totalCredit += numeric(l.credit);
  }
  const balanced = totalDebit === totalCredit;
  const nextFyExists = !!nfy;

  const plPrecheck = { hasNonZeroPL: false, accounts: [] };
  if (nfy) {
    const accounts = await models.Account.findAll({ where: { tenantId } });
    const plAccounts = accounts.filter((a) => parseInt(field(a.accountCode), 10) >= 6);
    const plIds = plAccounts.map((a) => a.id);
    if (plIds.length > 0) {
      const rems = await models.AccountRemaining.findAll({
        where: { tenantId, term: nextTerm, accountId: { [Op.in]: plIds } }
      });
      for (const r of rems) {
        if (numeric(r.debit) !== 0 || numeric(r.credit) !== 0) {
          const acc = plAccounts.find((a) => a.id === r.accountId);
          plPrecheck.hasNonZeroPL = true;
          plPrecheck.accounts.push({
            code: acc ? acc.accountCode : null,
            name: acc ? acc.name : null,
            debit: numeric(r.debit),
            credit: numeric(r.credit)
          });
        }
      }
    }
  }

  return {
    term,
    nextTerm,
    tenantId,
    unapprovedCount,
    totals: { debit: totalDebit, credit: totalCredit, balanced },
    nextFyExists,
    plPrecheck,
    checklist: {
      allApproved: unapprovedCount === 0,
      balanced,
      nextFyEmptyOrAbsent: !nextFyExists || !plPrecheck.hasNonZeroPL
    }
  };
}

export async function executeClosing(tenantId, user, term, plResetAcknowledged) {
  if (!user?.administrable) {
    return {
      status: 403,
      payload: { result: 'NG', code: 'FORBIDDEN', message: 'closing requires admin role' }
    };
  }
  const data = await buildConfirmData(tenantId, term);
  if (data.error) {
    return { status: 404, payload: { result: 'NG', message: data.error } };
  }
  if (data.plPrecheck.hasNonZeroPL && plResetAcknowledged !== true) {
    return {
      status: 409,
      payload: {
        result: 'NG',
        code: 'PL_RESET_NOT_ACKNOWLEDGED',
        message: 'Next term already has PL balances that will be reset; acknowledgement required.',
        plPrecheck: data.plPrecheck
      }
    };
  }
  await runYearEndClosing(tenantId, term);
  await audit({
    tenantId,
    actorId: user.id,
    action: 'closing',
    term,
    extra: {
      plResetAcknowledged,
      totalsSnapshot: data.totals,
      plPrecheck: data.plPrecheck,
      unapprovedCount: data.unapprovedCount
    }
  });
  return { status: 200, payload: { code: 0, result: 'OK', nextTerm: data.nextTerm } };
}
