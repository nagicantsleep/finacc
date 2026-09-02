/**
 * Trial Balance v2 — Issue #207 (E1.1).
 *
 * Public contract for the v2 response (additive, ?version=2 on the existing
 * /api/trial-balance route). Legacy (no version param) is unchanged.
 *
 *   { version: 2,
 *     meta:    { tenantId, term, reportType, period, fiscalYear,
 *                languageMode, generatedAt, warnings, totals, filters },
 *     lines:   [{ type, accountClassId, aclCode, major, middle, minor, ...,
 *                 openingDebit, openingCredit, movementDebit, movementCredit,
 *                 endingDebit, endingCredit, balance, warningCodes }, ...] }
 *
 * Three reportType values:
 *   - balance   残高試算表   — opening + ending per account
 *   - movement  合計試算表   — period movement per account
 *   - combined  合計残高試算表 — all six columns
 *
 * Engine output is flat; subtotals are the consumer's job (libs/reporting/tb-subtotal,
 * see E1.2). This module joins Account/SubAccount/AccountClass for bilingual
 * names + class-id filter, applies the optional filters, computes totals.
 */
import { enrichBilingual as defaultEnrichBilingual } from '../bilingual-helper.js';
import { balanceEngine } from './balance-engine.js';
import {
  runWarningRules,
  splitBannerAndLine,
  applyLineWarningCodes,
} from './warning-rules.js';

/**
 * Build a CrossSlipDetail-shaped entry source for [startDate, endDate).
 * Reused by E2 simulation; kept here so v2 has zero coupling to libs/trial_balance.
 */
function actualEntrySource(deps, tenantId, startDate, endDate) {
  return {
    name: 'actual',
    fetch: async () => {
      const rows = [];
      for (let mon = new Date(startDate); mon < new Date(endDate); ) {
        const slips = await deps.CrossSlip.findAll({
          where: {
            [deps.Sequelize.Op.and]: {
              tenantId,
              year: mon.getFullYear(),
              month: mon.getMonth() + 1,
            },
          },
          include: [{ model: deps.CrossSlipDetail, as: 'lines' }],
        });
        for (const slip of slips) {
          for (const d of slip.lines || []) {
            rows.push({
              debitAccount: d.debitAccount,
              debitSubAccount: d.debitSubAccount,
              debitAmount: d.debitAmount,
              creditAccount: d.creditAccount,
              creditSubAccount: d.creditSubAccount,
              creditAmount: d.creditAmount,
              approvedAt: slip.approvedAt,
            });
          }
        }
        mon.setMonth(mon.getMonth() + 1);
      }
      return rows;
    },
  };
}

async function resolvePeriod(deps, tenantId, term, month) {
  const fy = await deps.FiscalYear.findOne({ where: { tenantId, term } });
  if (!fy) {
    const e = new Error(`FiscalYear not found for tenant=${tenantId} term=${term}`);
    e.status = 404;
    throw e;
  }
  if (month) {
    const m = String(month).match(/^(\d{4})-(\d{1,2})$/);
    if (!m) {
      const e = new Error(`month must be YYYY-MM (got ${month})`);
      e.status = 400;
      throw e;
    }
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const start = new Date(y, mo, 1);
    const last = new Date(y, mo + 1, 0);
    return { fy, startDate: start, endDate: last, periodLabel: month };
  }
  return {
    fy,
    startDate: new Date(fy.startDate),
    endDate: new Date(fy.endDate),
    periodLabel: 'full',
  };
}

/**
 * Build the v2 response.
 *
 * params: { tenantId, term, reportType, month, accountClassIds, hideZero,
 *           includeUnapproved, languagePair }
 * deps:   models-like ({ Account, SubAccount, AccountClass, AccountRemaining,
 *                       SubAccountRemaining, CrossSlip, CrossSlipDetail,
 *                       FiscalYear, Sequelize })
 */
export async function trialBalanceV2(params, deps) {
  if (!deps) {
    throw new Error('trialBalanceV2: deps is required');
  }
  const {
    tenantId,
    term,
    reportType = 'balance',
    month = null,
    accountClassIds = [],
    hideZero = false,
    includeUnapproved = false,
    languagePair = null,
    entrySources = null,
  } = params || {};

  if (tenantId == null) {
    throw new Error('trialBalanceV2: tenantId is required (multi-tenant guard)');
  }
  if (term == null) {
    throw new Error('trialBalanceV2: term is required');
  }
  if (!['balance', 'movement', 'combined'].includes(reportType)) {
    const e = new Error(`reportType must be balance|movement|combined (got ${reportType})`);
    e.status = 400;
    throw e;
  }

  const { fy, startDate, endDate, periodLabel } = await resolvePeriod(deps, tenantId, term, month);
  // endDate is inclusive day boundary; advance one day so the month loop
  // and detail fetch include the final day.
  const fetchEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

  const sources = entrySources || [actualEntrySource(deps, tenantId, startDate, fetchEnd)];

  const engineResult = await balanceEngine(
    {
      tenantId,
      term,
      period: { from: startDate, to: endDate },
      entrySources: sources,
      options: { subAccount: true, includeUnapproved },
    },
    deps,
  );

  // Enrich with Account/SubAccount/AccountClass names + class id (for filter).
  const accountRows = await deps.Account.findAll({
    where: { tenantId },
    include: [
      { model: deps.SubAccount, as: 'subAccounts' },
      { model: deps.AccountClass, as: 'accountClass' },
    ],
  });
  const enrichBilingual = (deps && deps.enrichBilingual) || defaultEnrichBilingual;
  if (languagePair) {
    await enrichBilingual('AccountClass', accountRows.map((a) => a.accountClass).filter(Boolean), languagePair);
    await enrichBilingual('Account', accountRows, languagePair);
    await enrichBilingual(
      'SubAccount',
      accountRows.flatMap((a) => a.subAccounts || []),
      languagePair,
    );
  }

  const codeToAcc = new Map();
  const codeToClassId = new Map();
  const subKeyToSub = new Map();
  for (const a of accountRows) {
    codeToAcc.set(a.accountCode, a);
    codeToClassId.set(a.accountCode, a.accountClassId);
    for (const sub of a.subAccounts || []) {
      subKeyToSub.set(`${a.id}:${sub.subAccountCode}`, sub);
    }
  }

  const classIdFilter = new Set(
    (Array.isArray(accountClassIds) ? accountClassIds : String(accountClassIds).split(','))
      .map((v) => parseInt(v, 10))
      .filter((n) => Number.isFinite(n))
  );

  // Shape lines. Keep all six columns regardless of reportType; reportType
  // is meta and is the UI's cue for which to emphasize. (Export layer trims.)
  let lines = engineResult.lines.map((l) => {
    const acc = codeToAcc.get(l.code);
    const cls = acc ? acc.accountClass : null;
    const sub = l.subAccountId != null ? subKeyToSub.get(`${l.accountId}:${l.subCode}`) : null;
    return {
      type: l.subAccountId != null ? 'subAccount' : 'account',
      accountClassId: codeToClassId.get(l.code) || null,
      aclCode: cls ? `${cls.field}${String(cls.adding).padStart(2, '0')}` : null,
      major: cls ? cls.major : null,
      middle: cls ? cls.middle : null,
      minor: cls ? cls.minor : null,
      majorVi: cls ? cls.getDataValue('majorVi') || null : null,
      middleVi: cls ? cls.getDataValue('middleVi') || null : null,
      minorVi: cls ? cls.getDataValue('minorVi') || null : null,
      accountId: l.accountId,
      code: l.code,
      name: acc ? acc.name : l.code,
      nameVi: acc ? acc.getDataValue('nameVi') || null : null,
      subAccountId: l.subAccountId,
      subCode: l.subCode,
      subName: sub ? sub.name : null,
      subNameVi: sub ? sub.getDataValue('nameVi') || null : null,
      openingDebit: l.openingDebit,
      openingCredit: l.openingCredit,
      movementDebit: l.movementDebit,
      movementCredit: l.movementCredit,
      endingDebit: l.endingDebit,
      endingCredit: l.endingCredit,
      balance: l.endingBalance,
      warningCodes: [],
    };
  });

  // Filter: accountClassIds — only lines whose class is in the set.
  if (classIdFilter.size > 0) {
    lines = lines.filter((l) => l.accountClassId != null && classIdFilter.has(l.accountClassId));
  }

  // Filter: hideZero — a line is "non-zero" if any of the columns relevant to
  // the reportType has a non-zero value.
  if (hideZero) {
    const showBal = reportType === 'balance' || reportType === 'combined';
    const showMov = reportType === 'movement' || reportType === 'combined';
    lines = lines.filter((l) =>
      (showBal && (l.openingDebit || l.openingCredit || l.endingDebit || l.endingCredit)) ||
      (showMov && (l.movementDebit || l.movementCredit))
    );
  }

  // Totals: sums over the post-filter lines. The engine invariant guarantees
  // movementDebit === movementCredit globally; reportType-specific totals
  // follow trivially.
  const totals = lines.reduce(
    (acc, l) => {
      acc.openingDebit += l.openingDebit || 0;
      acc.openingCredit += l.openingCredit || 0;
      acc.movementDebit += l.movementDebit || 0;
      acc.movementCredit += l.movementCredit || 0;
      acc.endingDebit += l.endingDebit || 0;
      acc.endingCredit += l.endingCredit || 0;
      return acc;
    },
    { openingDebit: 0, openingCredit: 0, movementDebit: 0, movementCredit: 0, endingDebit: 0, endingCredit: 0 }
  );

  // Warnings (E1.6). Banner messages go on meta.warnings; per-line codes
  // get stamped onto each line's warningCodes. The v2 contract already
  // declared warningCodes[]; this is where it actually gets populated.
  const messages = await runWarningRules({ lines, meta: { tenantId, term, totals }, deps });
  const { banners, byLineKey } = splitBannerAndLine(messages);
  lines = applyLineWarningCodes(lines, byLineKey);

  return {
    version: 2,
    meta: {
      tenantId,
      term,
      reportType,
      period: { from: startDate, to: endDate, label: periodLabel },
      fiscalYear: { start: fy.startDate, end: fy.endDate },
      languageMode: languagePair
        ? Object.keys(languagePair).sort().join('+')
        : 'ja',
      generatedAt: new Date(),
      warnings: banners,
      totals,
      entrySourceNames: sources.map((s) => s.name),
      filters: {
        accountClassIds: Array.from(classIdFilter),
        hideZero: !!hideZero,
        includeUnapproved: !!includeUnapproved,
        month: month || null,
      },
    },
    lines,
  };
}

export { resolvePeriod, actualEntrySource };
