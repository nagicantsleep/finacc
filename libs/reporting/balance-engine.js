import { dc, field, numeric } from '../parse_account_code.js';

const lineKey = (accountId, subAccountId) =>
  subAccountId != null ? `sub:${subAccountId}` : `acc:${accountId}`;

const openingFromRemaining = (code, remaining) => {
  if (parseInt(field(code), 10) >= 6) {
    return { debit: 0, credit: 0, balance: 0 };
  }
  if (!remaining) {
    return { debit: 0, credit: 0, balance: 0 };
  }
  return {
    debit: numeric(remaining.debit),
    credit: numeric(remaining.credit),
    balance: numeric(remaining.balance),
  };
};

const computeEnding = (code, openingBalance, movementDebit, movementCredit) => {
  return dc(code) === 'D'
    ? openingBalance + movementDebit - movementCredit
    : openingBalance - movementDebit + movementCredit;
};

const aggregateMovements = (details, accountByCode, subAccountIdSet, movementByLineKey, opts) => {
  const { includeUnapproved = false } = opts || {};
  for (const d of details || []) {
    if (!includeUnapproved && !d.approvedAt) continue;
    if (d.debitAccount) {
      const subId = d.debitSubAccount || null;
      if (subId != null && !subAccountIdSet.has(subId)) continue;
      const accId = accountByCode.get(d.debitAccount);
      if (accId == null) continue;
      const k = subId != null ? `sub:${subId}` : `acc:${accId}`;
      const cur = movementByLineKey.get(k) || { debit: 0, credit: 0 };
      cur.debit += numeric(d.debitAmount);
      movementByLineKey.set(k, cur);
    }
    if (d.creditAccount) {
      const subId = d.creditSubAccount || null;
      if (subId != null && !subAccountIdSet.has(subId)) continue;
      const accId = accountByCode.get(d.creditAccount);
      if (accId == null) continue;
      const k = subId != null ? `sub:${subId}` : `acc:${accId}`;
      const cur = movementByLineKey.get(k) || { debit: 0, credit: 0 };
      cur.credit += numeric(d.creditAmount);
      movementByLineKey.set(k, cur);
    }
  }
};

/**
 * Single source of truth for opening/movement/ending balance.
 *
 * params:
 *   tenantId     - required
 *   term         - required, FiscalYear.term
 *   period       - optional { from, to } stored in meta
 *   entrySources - array of { name, fetch } where fetch() resolves to detail rows
 *                  (CrossSlipDetail-like: debitAccount, debitSubAccount, debitAmount,
 *                   creditAccount, creditSubAccount, creditAmount, approvedAt)
 *   options:
 *     includeUnapproved - default false
 *     subAccount        - default true (emit one line per sub-account when subs exist)
 *     accountClassIds / projectIds / labelIds - filtering hints; fetcher enforces
 *
 * deps: { Account, SubAccount, AccountRemaining, SubAccountRemaining }
 *       each must expose findAll({ where, include }). Production caller passes
 *       the result of `import models from '../../models/index.js'`.
 */
export async function balanceEngine(params, deps) {
  if (!deps) {
    throw new Error('balanceEngine: deps is required (pass models from models/index.js)');
  }
  const { tenantId, term, period = null, entrySources = [], options = {} } = params || {};
  if (tenantId == null) {
    throw new Error('balanceEngine: tenantId is required (multi-tenant guard)');
  }
  if (term == null) {
    throw new Error('balanceEngine: term is required');
  }
  if (!Array.isArray(entrySources)) {
    throw new Error('balanceEngine: entrySources must be an array of {name, fetch}');
  }

  const { includeUnapproved = false, subAccount = true } = options;

  const accounts = await deps.Account.findAll({
    where: { tenantId },
    include: [{ model: deps.SubAccount, as: 'subAccounts' }],
  });

  const priorTerm = term - 1;
  const accountRemaining = await deps.AccountRemaining.findAll({
    where: { tenantId, term: priorTerm },
  });
  const subAccountRemaining = await deps.SubAccountRemaining.findAll({
    where: { tenantId, term: priorTerm },
  });

  const accountByCode = new Map();
  const subAccountIdSet = new Set();
  for (const acc of accounts) {
    accountByCode.set(acc.code, acc.id);
    if (acc.subAccounts) {
      for (const sub of acc.subAccounts) {
        subAccountIdSet.add(sub.id);
      }
    }
  }

  const lineDefs = [];
  for (const acc of accounts) {
    if (subAccount && acc.subAccounts && acc.subAccounts.length > 0) {
      for (const sub of acc.subAccounts) {
        lineDefs.push({
          accountId: acc.id,
          accountCode: acc.code,
          subAccountId: sub.id,
          subCode: sub.subAccountCode,
          code: acc.code,
        });
      }
    } else {
      lineDefs.push({
        accountId: acc.id,
        accountCode: acc.code,
        subAccountId: null,
        subCode: null,
        code: acc.code,
      });
    }
  }

  const movementByLineKey = new Map();
  const sourceNames = [];
  for (const src of entrySources) {
    if (!src || !src.name || typeof src.fetch !== 'function') {
      throw new Error('balanceEngine: each entrySource must be {name, fetch}');
    }
    sourceNames.push(src.name);
    const details = await src.fetch();
    aggregateMovements(details, accountByCode, subAccountIdSet, movementByLineKey, { includeUnapproved });
  }

  const lines = lineDefs.map((ld) => {
    const remaining = ld.subAccountId != null
      ? subAccountRemaining.find((r) => r.subAccountId === ld.subAccountId)
      : accountRemaining.find((r) => r.accountId === ld.accountId);
    const opening = openingFromRemaining(ld.code, remaining);
    const movement = movementByLineKey.get(lineKey(ld.accountId, ld.subAccountId))
      || { debit: 0, credit: 0 };
    const endingBalance = computeEnding(ld.code, opening.balance, movement.debit, movement.credit);
    const isD = dc(ld.code) === 'D';
    return {
      accountId: ld.accountId,
      subAccountId: ld.subAccountId,
      code: ld.code,
      subCode: ld.subCode,
      name: null,
      nameVi: null,
      subName: null,
      subNameVi: null,
      major: null,
      middle: null,
      minor: null,
      majorVi: null,
      middleVi: null,
      minorVi: null,
      openingDebit: opening.debit,
      openingCredit: opening.credit,
      openingBalance: opening.balance,
      movementDebit: movement.debit,
      movementCredit: movement.credit,
      endingDebit: isD ? Math.max(endingBalance, 0) : Math.max(-endingBalance, 0),
      endingCredit: isD ? Math.max(-endingBalance, 0) : Math.max(endingBalance, 0),
      endingBalance,
    };
  });

  return {
    lines,
    warnings: [],
    meta: {
      generatedAt: new Date(),
      entrySourceNames: sourceNames,
      tenantId,
      term,
      period,
    },
  };
}

export { openingFromRemaining, computeEnding, aggregateMovements, lineKey };
