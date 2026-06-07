import models from '../models/index.js';
const Op = models.Sequelize.Op;
import Accounts from '../libs/accounts.js';
import { field, numeric } from '../libs/parse_account_code.js';
import TrialBalance from '../libs/trial_balance.js';
import closing from '../forms/closing.js';

/**
 * Build the pre-closing checklist for term, used by the confirm screen.
 * Returns counts + a PL precheck: whether the NEXT term already has non-zero
 * PL (field >= 6) remainings that would be reset by closing.
 */
const buildConfirmData = async (tenantId, term) => {
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
  if (!fy) {
    return { error: `Fiscal year for term ${term} not found.` };
  }
  const nextTerm = term + 1;
  const nfy = await models.FiscalYear.findOne({ where: { tenantId, term: nextTerm } });

  // Unapproved slips in this term.
  const unapprovedCount = await models.CrossSlip.count({
    where: { tenantId, term, approvedAt: { [Op.eq]: null } },
  });

  // Debit == credit for the term (from the canonical engine).
  const { lines } = await TrialBalance(tenantId, term);
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of lines) {
    if (!l.code) continue;
    totalDebit += numeric(l.debit);
    totalCredit += numeric(l.credit);
  }
  const balanced = totalDebit === totalCredit;

  // Next FY emptiness: does it exist, and does it already carry any movement?
  const nextFyExists = !!nfy;

  // PL precheck: any AccountRemaining(nextTerm, plAccount) with non-zero debit/credit.
  const plPrecheck = { hasNonZeroPL: false, accounts: [] };
  if (nfy) {
    const accounts = await models.Account.findAll({ where: { tenantId } });
    const plAccounts = accounts.filter((a) => parseInt(field(a.accountCode), 10) >= 6);
    const plIds = plAccounts.map((a) => a.id);
    if (plIds.length > 0) {
      const rems = await models.AccountRemaining.findAll({
        where: { tenantId, term: nextTerm, accountId: { [Op.in]: plIds } },
      });
      for (const r of rems) {
        if (numeric(r.debit) !== 0 || numeric(r.credit) !== 0) {
          const acc = plAccounts.find((a) => a.id === r.accountId);
          plPrecheck.hasNonZeroPL = true;
          plPrecheck.accounts.push({
            code: acc ? acc.accountCode : null,
            name: acc ? acc.name : null,
            debit: numeric(r.debit),
            credit: numeric(r.credit),
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
      nextFyEmptyOrAbsent: !nextFyExists || !plPrecheck.hasNonZeroPL,
    },
  };
};

export default {
  // GET /api/closing/:term/confirm — checklist data for the confirm screen.
  confirm: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    try {
      const term = parseInt(req.params.term);
      if (Number.isNaN(term)) {
        return res.status(400).json({ result: 'NG', message: 'invalid term' });
      }
      const data = await buildConfirmData(tenantId, term);
      if (data.error) {
        return res.status(404).json({ result: 'NG', message: data.error });
      }
      res.json({ result: 'OK', ...data });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/closing/:term — run closing. Admin only. Requires
  // plResetAcknowledged when the next term already holds non-zero PL balances.
  // Writes an AuditEvent row on success.
  post: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    try {
      const term = parseInt(req.params.term);
      if (Number.isNaN(term)) {
        return res.status(400).json({ result: 'NG', message: 'invalid term' });
      }

      // Role gate: closing (destructive reset) is admin-only.
      if (!req.session.user || !req.session.user.administrable) {
        return res.status(403).json({ result: 'NG', code: 'FORBIDDEN', message: 'closing requires admin role' });
      }

      const data = await buildConfirmData(tenantId, term);
      if (data.error) {
        return res.status(404).json({ result: 'NG', message: data.error });
      }

      const plResetAcknowledged = req.body && req.body.plResetAcknowledged === true;
      if (data.plPrecheck.hasNonZeroPL && !plResetAcknowledged) {
        return res.status(409).json({
          result: 'NG',
          code: 'PL_RESET_NOT_ACKNOWLEDGED',
          message: 'Next term already has PL balances that will be reset; acknowledgement required.',
          plPrecheck: data.plPrecheck,
        });
      }

      await closing(tenantId, term);

      await models.AuditEvent.create({
        tenantId,
        actorId: req.session.user.id,
        action: 'closing',
        term,
        payload: {
          plResetAcknowledged,
          totalsSnapshot: data.totals,
          plPrecheck: data.plPrecheck,
          unapprovedCount: data.unapprovedCount,
        },
      });

      res.json({ code: 0, result: 'OK', nextTerm: data.nextTerm });
    } catch (err) {
      next(err);
    }
  },
};
