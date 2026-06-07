/**
 * Unit tests — Issue #207 (E1.1): libs/reporting/trial-balance-v2.js
 *
 * Pure-function tests; deps is mocked inline. Covers the v2 response contract:
 *   - version 2 envelope
 *   - 3 reportType values (balance, movement, combined) — selection only,
 *     all six columns are always present
 *   - filter accountClassIds / hideZero
 *   - includeUnapproved toggle
 *   - totals block
 *   - languagePair metadata only (no VI mock; just label shape)
 *   - multi-tenant guards
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import { trialBalanceV2, resolvePeriod } from '../../libs/reporting/trial-balance-v2.js';

const TENANT_A = 1;
const TENANT_B = 2;

// Mimic Sequelize's getDataValue: returns the named property. Production
// models get it from sequelize; test fixtures are plain objects.
const withGd = (o) => {
  if (o && typeof o.getDataValue !== 'function') {
    o.getDataValue = (k) => o[k];
  }
  return o;
};

const fy = {
  tenantId: TENANT_A,
  term: 1,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
};

// 1 BS debit (cash) + 1 BS credit (capital) + 1 PL expense + 1 sub-having
// account whose sub 1 will have movement. Two AccountClasses so we can
// filter by class.
const accountRows = [
  withGd({ id: 1, accountCode: '1000000', tenantId: TENANT_A, accountClassId: 10,
    name: '現金', nameVi: 'Tiền mặt',
    accountClass: withGd({ id: 10, field: 1, adding: 0, major: '資産', middle: '流動資産', minor: '現金' }),
    subAccounts: [] }),
  withGd({ id: 2, accountCode: '3000000', tenantId: TENANT_A, accountClassId: 20,
    name: '資本金', nameVi: 'Vốn',
    accountClass: withGd({ id: 20, field: 3, adding: 0, major: '負債', middle: '資本', minor: '資本金' }),
    subAccounts: [] }),
  withGd({ id: 3, accountCode: '7000000', tenantId: TENANT_A, accountClassId: 30,
    name: '売上原価', nameVi: 'Giá vốn',
    accountClass: withGd({ id: 30, field: 7, adding: 0, major: '費用', middle: '売上原価', minor: '仕入' }),
    subAccounts: [] }),
  withGd({ id: 4, accountCode: '3050000', tenantId: TENANT_A, accountClassId: 20,
    name: '買掛金', nameVi: 'Phải trả',
    accountClass: withGd({ id: 20, field: 3, adding: 5, major: '負債', middle: '流動負債', minor: '買掛金' }),
    subAccounts: [
      withGd({ id: 100, accountId: 4, subAccountCode: 1, name: 'A社', nameVi: 'Cty A' }),
    ] }),
  withGd({ id: 99, accountCode: '9990000', tenantId: TENANT_B, accountClassId: 99,
    name: 'OTHER', nameVi: null,
    accountClass: withGd({ id: 99, field: 9, adding: 0, major: '他', middle: '', minor: '' }),
    subAccounts: [] }),
  withGd({ id: 5, accountCode: '2000000', tenantId: TENANT_A, accountClassId: 40,
    name: '普通預金', nameVi: 'TK thường',
    accountClass: withGd({ id: 40, field: 2, adding: 0, major: '資産', middle: '流動資産', minor: '普通預金' }),
    subAccounts: [] }),
];

const accountRemaining = [
  { accountId: 1, term: 1, debit: 100, credit: 0, balance: 100, tenantId: TENANT_A },
  { accountId: 2, term: 1, debit: 0, credit: 100, balance: 100, tenantId: TENANT_A },
  { accountId: 3, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
  { accountId: 5, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
  { subAccountId: 100, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
  { accountId: 99, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_B },
];

const subAccountRemaining = [
  { subAccountId: 100, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
];

const APPROVED = { approvedAt: new Date('2026-06-01') };

// 1000000(D) ← 3000000(C) for 200; 7000000(D) ← 1000000(C) for 50;
// 3050000/1 credit 30, 1000000 debit 30.
const detailsFor = () => ([
  { debitAccount: '1000000', debitSubAccount: null, debitAmount: 200, ...APPROVED, creditAccount: '3000000', creditSubAccount: null, creditAmount: 200 },
  { debitAccount: '7000000', debitSubAccount: null, debitAmount: 50,  ...APPROVED, creditAccount: '1000000', creditSubAccount: null, creditAmount: 50 },
  { debitAccount: '1000000', debitSubAccount: null, debitAmount: 30,  ...APPROVED, creditAccount: '3050000', creditSubAccount: 1, creditAmount: 30 },
]);

const makeDeps = (overrides = {}) => {
  // CrossSlip.findAll is called once per month by actualEntrySource. The
  // production DB returns data only for months with slips; in this unit
  // test, return data only on the first call so the engine doesn't sum
  // the same fixtures 12 times.
  let crossSlipCalls = 0;
  return {
    Sequelize: { Op: { and: Symbol.for('and') } },
    Account: {
      findAll: async ({ where }) => {
        const tid = where && where.tenantId;
        return accountRows.filter((a) => tid == null || a.tenantId === tid);
      },
    },
    SubAccount: {},
    AccountClass: {},
    AccountRemaining: {
      findAll: async ({ where }) => {
        const tid = where && where.tenantId;
        const term = where && where.term;
        return accountRemaining.filter((r) =>
          (tid == null || r.tenantId === tid) && (term == null || r.term === term));
      },
    },
    SubAccountRemaining: {
      findAll: async ({ where }) => {
        const tid = where && where.tenantId;
        const term = where && where.term;
        return subAccountRemaining.filter((r) =>
          (tid == null || r.tenantId === tid) && (term == null || r.term === term));
      },
    },
    CrossSlip: {
      findAll: async () => {
        crossSlipCalls += 1;
        if (crossSlipCalls === 1) {
          return [{ lines: detailsFor(), approvedAt: APPROVED.approvedAt }];
        }
        return [];
      },
    },
    CrossSlipDetail: {},
    FiscalYear: {
      findOne: async () => fy,
    },
    // No-op stub: tests don't exercise the real DB-driven translation join.
    enrichBilingual: async () => {},
    ...overrides,
  };
};

const baseParams = (over = {}) => ({
  tenantId: TENANT_A,
  term: 1,
  ...over,
});

// ---------------------------------------------------------------------------
// resolvePeriod
// ---------------------------------------------------------------------------

describe('resolvePeriod', () => {
  it('returns full FY when no month', async () => {
    const out = await resolvePeriod(makeDeps(), TENANT_A, 1, null);
    assert.equal(out.periodLabel, 'full');
    assert.equal(out.fy, fy);
  });
  it('returns monthly window for YYYY-MM', async () => {
    const out = await resolvePeriod(makeDeps(), TENANT_A, 1, '2026-06');
    assert.equal(out.periodLabel, '2026-06');
    assert.equal(out.startDate.getMonth(), 5);
    assert.equal(out.startDate.getDate(), 1);
    // Last day of June is June 30 — getMonth() is 0-indexed, so 5 (June).
    assert.equal(out.endDate.getMonth(), 5);
    assert.equal(out.endDate.getDate(), 30);
  });
  it('throws on malformed month', async () => {
    await assert.rejects(
      () => resolvePeriod(makeDeps(), TENANT_A, 1, '2026/06'),
      /YYYY-MM/
    );
  });
});

// ---------------------------------------------------------------------------
// envelope
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — envelope', () => {
  it('returns version: 2 with meta + lines', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.equal(out.version, 2);
    assert.ok(out.meta);
    assert.ok(Array.isArray(out.lines));
    assert.ok(out.meta.generatedAt instanceof Date);
  });
  it('rejects missing deps', async () => {
    await assert.rejects(() => trialBalanceV2(baseParams(), null), /deps is required/);
  });
  it('rejects missing tenantId', async () => {
    await assert.rejects(
      () => trialBalanceV2({ term: 1 }, makeDeps()),
      /tenantId is required/
    );
  });
  it('rejects missing term', async () => {
    await assert.rejects(
      () => trialBalanceV2({ tenantId: TENANT_A }, makeDeps()),
      /term is required/
    );
  });
  it('rejects unknown reportType', async () => {
    await assert.rejects(
      () => trialBalanceV2({ ...baseParams(), reportType: 'nope' }, makeDeps()),
      /balance\|movement\|combined/
    );
  });
});

// ---------------------------------------------------------------------------
// reportType — selection only; all 6 columns present
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — reportType', () => {
  it('defaults to balance', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.equal(out.meta.reportType, 'balance');
  });
  it('accepts movement', async () => {
    const out = await trialBalanceV2({ ...baseParams(), reportType: 'movement' }, makeDeps());
    assert.equal(out.meta.reportType, 'movement');
  });
  it('accepts combined', async () => {
    const out = await trialBalanceV2({ ...baseParams(), reportType: 'combined' }, makeDeps());
    assert.equal(out.meta.reportType, 'combined');
  });
  it('every line has all six columns regardless of reportType', async () => {
    for (const rt of ['balance', 'movement', 'combined']) {
      const out = await trialBalanceV2({ ...baseParams(), reportType: rt }, makeDeps());
      for (const l of out.lines) {
        for (const k of ['openingDebit','openingCredit','movementDebit','movementCredit','endingDebit','endingCredit']) {
          assert.equal(typeof l[k], 'number', `${rt} line ${l.code} missing ${k}`);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// per-line shape
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — per-line shape', () => {
  it('emits subAccount type for accounts with sub lines', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    const sub = out.lines.find((l) => l.subAccountId === 100);
    assert.ok(sub, 'sub line for 3050000/1 should exist');
    assert.equal(sub.type, 'subAccount');
    assert.equal(sub.subCode, 1);
    assert.equal(sub.subName, 'A社');
    assert.equal(sub.subNameVi, 'Cty A');
  });
  it('emits account type for accounts with no subs', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    const cash = out.lines.find((l) => l.code === '1000000');
    assert.equal(cash.type, 'account');
    assert.equal(cash.subAccountId, null);
    assert.equal(cash.name, '現金');
  });
  it('attaches accountClassId + aclCode for filter', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    const cash = out.lines.find((l) => l.code === '1000000');
    assert.equal(cash.accountClassId, 10);
    assert.equal(cash.aclCode, '100');
  });
  it('warningCodes is always an empty array (E1.6 populates it)', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    for (const l of out.lines) assert.deepEqual(l.warningCodes, []);
  });
  it('multi-tenant isolation: tenant A lines do not include tenant B accounts', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.ok(out.lines.every((l) => l.code !== '9990000'));
  });
  it('tenant B gets only its own accounts', async () => {
    const out = await trialBalanceV2({ ...baseParams(), tenantId: TENANT_B }, makeDeps());
    assert.equal(out.lines.length, 1);
    assert.equal(out.lines[0].code, '9990000');
  });
});

// ---------------------------------------------------------------------------
// filters
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — filters', () => {
  it('accountClassIds: keeps only matching class', async () => {
    const out = await trialBalanceV2({ ...baseParams(), accountClassIds: [20] }, makeDeps());
    const codes = out.lines.map((l) => l.code).filter((c, i, a) => a.indexOf(c) === i);
    assert.ok(codes.every((c) => ['3000000', '3050000'].includes(c)), `unexpected codes: ${codes.join(',')}`);
  });
  it('accountClassIds accepts csv string', async () => {
    const out = await trialBalanceV2({ ...baseParams(), accountClassIds: '10,30' }, makeDeps());
    const codes = new Set(out.lines.map((l) => l.code));
    assert.ok(codes.has('1000000'));
    assert.ok(codes.has('7000000'));
    assert.ok(!codes.has('3000000'));
  });
  it('hideZero: drops all-zero lines for the report type', async () => {
    // 2000000 (普通預金): no opening, no movement — should be hidden in any
    // mode under hideZero. 3000000 has movement (credit 200 from detail 1),
    // so it must remain in movement mode.
    const balance = await trialBalanceV2({ ...baseParams(), hideZero: true }, makeDeps());
    assert.ok(!balance.lines.some((l) => l.code === '2000000'),
      'all-zero account should be hidden in balance mode');
    const movement = await trialBalanceV2({ ...baseParams(), reportType: 'movement', hideZero: true }, makeDeps());
    assert.ok(!movement.lines.some((l) => l.code === '2000000'),
      'all-zero account should be hidden in movement mode');
    assert.ok(movement.lines.some((l) => l.code === '3000000'),
      'capital with credit-movement 200 should remain in movement mode');
  });
  it('hideZero: combined mode keeps lines with any of opening/movement/ending', async () => {
    const combined = await trialBalanceV2({ ...baseParams(), reportType: 'combined', hideZero: true }, makeDeps());
    assert.ok(combined.lines.some((l) => l.code === '7000000'));
  });
});

// ---------------------------------------------------------------------------
// includeUnapproved
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — includeUnapproved', () => {
  it('default false: filter reaches the engine', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.equal(out.meta.filters.includeUnapproved, false);
  });
  it('true toggle is reflected in meta', async () => {
    const out = await trialBalanceV2({ ...baseParams(), includeUnapproved: true }, makeDeps());
    assert.equal(out.meta.filters.includeUnapproved, true);
  });
});

// ---------------------------------------------------------------------------
// totals
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — totals', () => {
  it('totals.movementDebit === totals.movementCredit (engine invariant)', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.equal(out.meta.totals.movementDebit, out.meta.totals.movementCredit);
  });
  it('totals match sum of post-filter lines', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    const sum = (k) => out.lines.reduce((s, l) => s + (l[k] || 0), 0);
    for (const k of ['openingDebit','openingCredit','movementDebit','movementCredit','endingDebit','endingCredit']) {
      assert.equal(out.meta.totals[k], sum(k), `totals.${k} mismatch`);
    }
  });
  it('totals respect accountClassIds filter', async () => {
    const full = await trialBalanceV2(baseParams(), makeDeps());
    const filtered = await trialBalanceV2({ ...baseParams(), accountClassIds: [10] }, makeDeps());
    assert.notEqual(full.meta.totals.movementDebit, filtered.meta.totals.movementDebit);
  });
});

// ---------------------------------------------------------------------------
// languagePair meta
// ---------------------------------------------------------------------------

describe('trialBalanceV2 — languagePair', () => {
  it('languageMode is "ja" when no languagePair', async () => {
    const out = await trialBalanceV2(baseParams(), makeDeps());
    assert.equal(out.meta.languageMode, 'ja');
  });
  it('languageMode joins keys with "+" when languagePair present', async () => {
    const out = await trialBalanceV2(
      { ...baseParams(), languagePair: { ja: 'vi', vi: 'ja' } },
      makeDeps()
    );
    assert.equal(out.meta.languageMode, 'ja+vi');
  });
});
