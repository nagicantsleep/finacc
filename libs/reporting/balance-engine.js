import { dc, field, numeric } from '../parse_account_code.js';

const codeOf = (acc) => (acc.accountCode != null ? acc.accountCode : acc.code);

// Movement is keyed by (accountId, subAccountCode) because CrossSlipDetail
// stores the per-account sub-account CODE in debitSubAccount/creditSubAccount,
// not the SubAccount primary key. Opening, by contrast, is keyed by
// subAccountId (SubAccountRemaining.subAccountId), so the two are resolved
// from different identifiers on purpose.
const lineKey = (accountId, subCode) =>
  subCode != null ? `sub:${accountId}:${subCode}` : `acc:${accountId}`;

const normalizeSubCode = (raw) => {
  if (raw == null) return null;
  if (raw === 0 || raw === '0') return null;
  return raw;
};

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

/**
 * Aggregate movement from detail rows into a Map keyed by lineKey().
 *
 * accountByCode  Map<accountCode, accountId>
 * validSubKeys   Set<`${accountId}:${subAccountCode}`> — known sub-accounts
 * opts.subAccount  when false, sub-account movement rolls up to the parent
 *                  account line; when true, it is kept per sub-account.
 */
const aggregateMovements = (details, accountByCode, validSubKeys, movementByLineKey, opts) => {
  const { includeUnapproved = false, subAccount = true } = opts || {};
  const route = (code, subRaw, d, amountField, side) => {
    if (!code) return;
    const accId = accountByCode.get(code);
    if (accId == null) return;
    const subCode = normalizeSubCode(subRaw);
    let k;
    if (subAccount && subCode != null) {
      if (!validSubKeys.has(`${accId}:${subCode}`)) return; // orphan sub-account
      k = `sub:${accId}:${subCode}`;
    } else {
      k = `acc:${accId}`;
    }
    const cur = movementByLineKey.get(k) || { debit: 0, credit: 0 };
    cur[side] += numeric(d[amountField]);
    movementByLineKey.set(k, cur);
  };
  for (const d of details || []) {
    if (!includeUnapproved && !d.approvedAt) continue;
    route(d.debitAccount, d.debitSubAccount, d, 'debitAmount', 'debit');
    route(d.creditAccount, d.creditSubAccount, d, 'creditAmount', 'credit');
  }
};

/**
 * Single source of truth for opening/movement/ending balance.
 *
 * params:
 *   tenantId     - required
 *   term         - required, FiscalYear.term. Opening is read from
 *                  AccountRemaining/SubAccountRemaining AT THIS term (setup and
 *                  closing both write a term's opening into that term's row).
 *   period       - optional { from, to } stored in meta; the fetcher enforces it
 *   entrySources - array of { name, fetch } where fetch() resolves to detail rows
 *                  (CrossSlipDetail-like: debitAccount, debitSubAccount [=sub
 *                   CODE], debitAmount, creditAccount, creditSubAccount,
 *                   creditAmount, approvedAt)
 *   options:
 *     includeUnapproved - default false
 *     subAccount        - default true. true → one line per sub-account when subs
 *                         exist, movement keyed by (accountId, subCode). false →
 *                         one line per account, sub movement rolled up to parent.
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

  const accountRemaining = await deps.AccountRemaining.findAll({
    where: { tenantId, term },
  });
  const subAccountRemaining = await deps.SubAccountRemaining.findAll({
    where: { tenantId, term },
  });

  const accountByCode = new Map();
  const validSubKeys = new Set();
  for (const acc of accounts) {
    accountByCode.set(codeOf(acc), acc.id);
    if (acc.subAccounts) {
      for (const sub of acc.subAccounts) {
        validSubKeys.add(`${acc.id}:${sub.subAccountCode}`);
      }
    }
  }

  const lineDefs = [];
  for (const acc of accounts) {
    const accCode = codeOf(acc);
    if (subAccount && acc.subAccounts && acc.subAccounts.length > 0) {
      for (const sub of acc.subAccounts) {
        lineDefs.push({
          accountId: acc.id,
          subAccountId: sub.id,
          subCode: sub.subAccountCode,
          code: accCode,
        });
      }
    } else {
      lineDefs.push({
        accountId: acc.id,
        subAccountId: null,
        subCode: null,
        code: accCode,
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
    aggregateMovements(details, accountByCode, validSubKeys, movementByLineKey, {
      includeUnapproved,
      subAccount,
    });
  }

  const lines = lineDefs.map((ld) => {
    const remaining = ld.subAccountId != null
      ? subAccountRemaining.find((r) => r.subAccountId === ld.subAccountId)
      : accountRemaining.find((r) => r.accountId === ld.accountId);
    const opening = openingFromRemaining(ld.code, remaining);
    const movement = movementByLineKey.get(lineKey(ld.accountId, ld.subCode))
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
