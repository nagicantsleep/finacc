/**
 * Unit tests — Issue #195: libs/reporting/balance-engine.js
 *
 * Pure-function tests, no DB. deps is mocked inline.
 *
 * Run with: npm test (mocha glob picks up this file)
 */

import { strict as assert } from 'node:assert';
import {
  balanceEngine,
  openingFromRemaining,
  computeEnding,
  aggregateMovements,
  lineKey,
} from '../../libs/reporting/balance-engine.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_A = 1;
const TENANT_B = 2;

const accounts = [
  { id: 1, code: '1110000', tenantId: TENANT_A, subAccounts: [] },
  { id: 2, code: '3010000', tenantId: TENANT_A, subAccounts: [
    { id: 100, subAccountCode: 1, accountId: 2, tenantId: TENANT_A },
    { id: 101, subAccountCode: 2, accountId: 2, tenantId: TENANT_A },
  ]},
  { id: 3, code: '5040000', tenantId: TENANT_A, subAccounts: [] },
  { id: 4, code: '6010000', tenantId: TENANT_A, subAccounts: [] },
  { id: 5, code: '7010000', tenantId: TENANT_A, subAccounts: [] },
  { id: 6, code: '7020010', tenantId: TENANT_A, subAccounts: [] },
  { id: 7, code: '9990000', tenantId: TENANT_B, subAccounts: [] },
];

const accountRemaining = [
  { accountId: 1, term: 1, debit: 100, credit: 0, balance: 100, tenantId: TENANT_A },
  { accountId: 2, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
  { accountId: 3, term: 1, debit: 50, credit: 50, balance: 0, tenantId: TENANT_A },
  { accountId: 4, term: 1, debit: 999, credit: 0, balance: 999, tenantId: TENANT_A },
  { accountId: 5, term: 1, debit: 0, credit: 123, balance: 123, tenantId: TENANT_A },
  { accountId: 6, term: 1, debit: 0, credit: 0, balance: 0, tenantId: TENANT_A },
  { subAccountId: 100, term: 1, debit: 0, credit: 200, balance: 200, tenantId: TENANT_A },
  { subAccountId: 101, term: 1, debit: 300, credit: 0, balance: 300, tenantId: TENANT_A },
];

const subAccountRemaining = [
  { subAccountId: 100, term: 1, debit: 0, credit: 200, balance: 200, tenantId: TENANT_A },
  { subAccountId: 101, term: 1, debit: 300, credit: 0, balance: 300, tenantId: TENANT_A },
];

const makeDeps = (overrides = {}) => ({
  Account: {
    findAll: async ({ where }) => {
      const tid = where && where.tenantId;
      return accounts.filter((a) => tid == null || a.tenantId === tid);
    },
  },
  SubAccount: {},
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
  ...overrides,
});

const APPROVED = { approvedAt: new Date('2026-06-01') };

// ---------------------------------------------------------------------------
// lineKey
// ---------------------------------------------------------------------------

describe('lineKey', () => {
  it('uses sub: prefix for sub-account lines', () => {
    assert.equal(lineKey(1, 100), 'sub:100');
  });
  it('uses acc: prefix for account-level lines', () => {
    assert.equal(lineKey(1, null), 'acc:1');
  });
});

// ---------------------------------------------------------------------------
// computeEnding
// ---------------------------------------------------------------------------

describe('computeEnding', () => {
  it('D-nature: opening=100, debit=50, credit=30 → ending=120', () => {
    assert.equal(computeEnding('1110000', 100, 50, 30), 120);
  });
  it('C-nature: opening=200, debit=50, credit=30 → ending=180', () => {
    assert.equal(computeEnding('5040000', 200, 50, 30), 180);
  });
  it('7020010 override: dc=C even though field=7', () => {
    const eb = computeEnding('7020010', 0, 100, 50);
    assert.equal(eb, -50, 'C-nature: 0 - 100 + 50 = -50');
  });
  it('D-nature with negative ending produces negative value', () => {
    assert.equal(computeEnding('1110000', 10, 0, 50), -40);
  });
});

// ---------------------------------------------------------------------------
// openingFromRemaining
// ---------------------------------------------------------------------------

describe('openingFromRemaining', () => {
  it('BS account returns debit/credit/balance from remaining', () => {
    const r = openingFromRemaining('1110000', { debit: 100, credit: 30, balance: 70 });
    assert.deepEqual(r, { debit: 100, credit: 30, balance: 70 });
  });
  it('PL account (field >= 6) ignores remaining and returns zeros', () => {
    const r = openingFromRemaining('6010000', { debit: 999, credit: 0, balance: 999 });
    assert.deepEqual(r, { debit: 0, credit: 0, balance: 0 });
  });
  it('null remaining yields zeros for BS', () => {
    assert.deepEqual(openingFromRemaining('1110000', null), { debit: 0, credit: 0, balance: 0 });
  });
  it('PL expense (field=7) ignores prior-term carry', () => {
    const r = openingFromRemaining('7010000', { debit: 0, credit: 123, balance: 123 });
    assert.deepEqual(r, { debit: 0, credit: 0, balance: 0 });
  });
});

// ---------------------------------------------------------------------------
// aggregateMovements
// ---------------------------------------------------------------------------

describe('aggregateMovements', () => {
  const accMap = new Map([
    ['1110000', 1],
    ['3010000', 2],
    ['3010000', 2],
    ['5040000', 3],
    ['6010000', 4],
    ['7010000', 5],
    ['7020010', 6],
  ]);

  it('single source: one detail credits account', () => {
    const out = new Map();
    aggregateMovements(
      [{ debitAccount: '1110000', debitAmount: 100, ...APPROVED }],
      accMap, new Set(), out, {}
    );
    assert.deepEqual(out.get('acc:1'), { debit: 100, credit: 0 });
  });

  it('multi-source: each fetcher contributes to same line', () => {
    const out = new Map();
    const set = new Set();
    aggregateMovements(
      [{ debitAccount: '1110000', debitAmount: 50, ...APPROVED }],
      accMap, set, out, {}
    );
    aggregateMovements(
      [{ debitAccount: '1110000', debitAmount: 30, ...APPROVED }],
      accMap, set, out, {}
    );
    assert.deepEqual(out.get('acc:1'), { debit: 80, credit: 0 });
  });

  it('filters unapproved when includeUnapproved=false (default)', () => {
    const out = new Map();
    aggregateMovements(
      [
        { debitAccount: '1110000', debitAmount: 100, ...APPROVED },
        { debitAccount: '1110000', debitAmount: 999, approvedAt: null },
      ],
      accMap, new Set(), out, {}
    );
    assert.equal(out.get('acc:1').debit, 100, 'unapproved entry ignored');
  });

  it('includes unapproved when includeUnapproved=true', () => {
    const out = new Map();
    aggregateMovements(
      [
        { debitAccount: '1110000', debitAmount: 100, ...APPROVED },
        { debitAccount: '1110000', debitAmount: 999, approvedAt: null },
      ],
      accMap, new Set(), out, { includeUnapproved: true }
    );
    assert.equal(out.get('acc:1').debit, 1099);
  });

  it('routes sub-account detail to sub: line key', () => {
    const out = new Map();
    const subSet = new Set([100]);
    aggregateMovements(
      [
        { creditAccount: '3010000', creditSubAccount: 100, creditAmount: 50, ...APPROVED },
        { debitAccount: '3010000', debitSubAccount: 100, debitAmount: 70, ...APPROVED },
      ],
      accMap, subSet, out, {}
    );
    assert.deepEqual(out.get('sub:100'), { debit: 70, credit: 50 });
  });

  it('skips detail whose subAccountId is not in master set', () => {
    const out = new Map();
    const subSet = new Set([100]);
    aggregateMovements(
      [{ debitAccount: '3010000', debitSubAccount: 999, debitAmount: 50, ...APPROVED }],
      accMap, subSet, out, {}
    );
    assert.equal(out.size, 0, 'orphan sub-account detail ignored');
  });

  it('skips detail whose account code is unknown', () => {
    const out = new Map();
    aggregateMovements(
      [{ debitAccount: '9999999', debitAmount: 50, ...APPROVED }],
      accMap, new Set(), out, {}
    );
    assert.equal(out.size, 0, 'unknown code detail ignored');
  });
});

// ---------------------------------------------------------------------------
// balanceEngine — multi-tenant guards
// ---------------------------------------------------------------------------

describe('balanceEngine — multi-tenant guards', () => {
  it('throws when tenantId is missing', async () => {
    await assert.rejects(
      () => balanceEngine({ term: 1, entrySources: [] }, makeDeps()),
      /tenantId is required/
    );
  });
  it('throws when tenantId is null', async () => {
    await assert.rejects(
      () => balanceEngine({ tenantId: null, term: 1, entrySources: [] }, makeDeps()),
      /tenantId is required/
    );
  });
  it('throws when term is missing', async () => {
    await assert.rejects(
      () => balanceEngine({ tenantId: 1, entrySources: [] }, makeDeps()),
      /term is required/
    );
  });
  it('throws when deps is missing', async () => {
    await assert.rejects(
      () => balanceEngine({ tenantId: 1, term: 1, entrySources: [] }),
      /deps is required/
    );
  });
  it('throws when entrySources is not an array', async () => {
    await assert.rejects(
      () => balanceEngine({ tenantId: 1, term: 1, entrySources: 'nope' }, makeDeps()),
      /entrySources must be an array/
    );
  });
  it('throws when entrySource is malformed', async () => {
    await assert.rejects(
      () => balanceEngine(
        { tenantId: 1, term: 1, entrySources: [{ name: 'x' }] },
        makeDeps()
      ),
      /\{name, fetch\}/
    );
  });
});

// ---------------------------------------------------------------------------
// balanceEngine — integration
// ---------------------------------------------------------------------------

describe('balanceEngine — integration', () => {
  it('emits flat list: one line per sub-account when subs exist', async () => {
    const result = await balanceEngine(
      { tenantId: TENANT_A, term: 1, entrySources: [] },
      makeDeps()
    );
    const subLines = result.lines.filter((l) => l.subAccountId != null);
    assert.equal(subLines.length, 2, 'account 2 has 2 sub-accounts');
    assert.ok(subLines.every((l) => l.code === '3010000'));
    assert.deepEqual(
      subLines.map((l) => l.subAccountId).sort(),
      [100, 101]
    );
  });

  it('opening from sub-account remaining, not from parent', async () => {
    const result = await balanceEngine(
      { tenantId: TENANT_A, term: 1, entrySources: [] },
      makeDeps()
    );
    const sub100 = result.lines.find((l) => l.subAccountId === 100);
    const sub101 = result.lines.find((l) => l.subAccountId === 101);
    assert.equal(sub100.openingBalance, 200, 'sub 100 opening = 200 (credit balance)');
    assert.equal(sub101.openingBalance, 300, 'sub 101 opening = 300');
  });

  it('endingDebit/endingCredit are T-account split of endingBalance', async () => {
    const result = await balanceEngine(
      { tenantId: TENANT_A, term: 1, entrySources: [] },
      makeDeps()
    );
    const sub100 = result.lines.find((l) => l.subAccountId === 100);
    assert.equal(sub100.endingBalance, 200);
    assert.equal(sub100.endingCredit, 200, 'C-nature with positive balance → credit side');
    assert.equal(sub100.endingDebit, 0);
  });

  it('7020010 override produces C-nature ending', async () => {
    const deps = makeDeps();
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        entrySources: [{
          name: 'actual',
          fetch: async () => [
            { debitAccount: '7020010', debitAmount: 200, ...APPROVED },
            { creditAccount: '7020010', creditAmount: 50, ...APPROVED },
          ],
        }],
      },
      deps
    );
    const line = result.lines.find((l) => l.code === '7020010');
    assert.equal(line.endingBalance, -150, 'C-nature: 0 - 200 + 50 = -150');
    assert.equal(line.endingDebit, 150, 'negative balance → opposite side (debit)');
    assert.equal(line.endingCredit, 0);
  });

  it('PL opening from prior term is ignored (revenue/expense reset)', async () => {
    const result = await balanceEngine(
      { tenantId: TENANT_A, term: 1, entrySources: [] },
      makeDeps()
    );
    const rev = result.lines.find((l) => l.code === '6010000');
    const exp = result.lines.find((l) => l.code === '7010000');
    assert.equal(rev.openingBalance, 0, 'revenue: prior 999 ignored');
    assert.equal(exp.openingBalance, 0, 'expense: prior 123 ignored');
  });

  it('meta.tenantId / meta.term / meta.entrySourceNames are populated', async () => {
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        period: { from: new Date('2026-01-01'), to: new Date('2026-12-31') },
        entrySources: [{ name: 'actual', fetch: async () => [] }],
      },
      makeDeps()
    );
    assert.equal(result.meta.tenantId, TENANT_A);
    assert.equal(result.meta.term, 1);
    assert.deepEqual(result.meta.entrySourceNames, ['actual']);
    assert.ok(result.meta.period);
    assert.ok(result.meta.generatedAt instanceof Date);
  });

  it('isolates tenants: tenant B has no lines from tenant A accounts', async () => {
    const result = await balanceEngine(
      { tenantId: TENANT_B, term: 1, entrySources: [] },
      makeDeps()
    );
    assert.equal(result.lines.length, 1, 'tenant B has 1 account (9990000)');
    assert.equal(result.lines[0].code, '9990000');
  });

  it('multi-source: totalDebit === totalCredit invariant', async () => {
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        entrySources: [
          {
            name: 'actual',
            fetch: async () => [
              { debitAccount: '1110000', debitAmount: 500, ...APPROVED },
              { creditAccount: '5040000', creditAmount: 500, ...APPROVED },
              { debitAccount: '7010000', debitAmount: 200, ...APPROVED },
              { creditAccount: '1110000', creditAmount: 200, ...APPROVED },
            ],
          },
          {
            name: 'simulation',
            fetch: async () => [
              { debitAccount: '1110000', debitAmount: 100, ...APPROVED },
              { creditAccount: '6010000', creditAmount: 100, ...APPROVED },
            ],
          },
        ],
      },
      makeDeps()
    );
    const totalDebit = result.lines.reduce((s, l) => s + l.movementDebit, 0);
    const totalCredit = result.lines.reduce((s, l) => s + l.movementCredit, 0);
    assert.equal(totalDebit, totalCredit, `D=${totalDebit} C=${totalCredit}`);
    assert.deepEqual(result.meta.entrySourceNames, ['actual', 'simulation']);
  });

  it('decimal safety: 1000 × 1,000,000 sums to 1,000,000,000 without drift', () => {
    const out = new Map();
    const accMap = new Map([['1110000', 1]]);
    const details = [];
    for (let i = 0; i < 1000; i += 1) {
      details.push({ debitAccount: '1110000', debitAmount: 1_000_000, ...APPROVED });
    }
    aggregateMovements(details, accMap, new Set(), out, {});
    assert.equal(out.get('acc:1').debit, 1_000_000_000);
  });

  it('subtotal invariant: sum of sub-account endings equals account parent total', async () => {
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        entrySources: [{
          name: 'actual',
          fetch: async () => [
            { creditAccount: '3010000', creditSubAccount: 100, creditAmount: 30, ...APPROVED },
            { debitAccount: '3010000', debitSubAccount: 101, debitAmount: 40, ...APPROVED },
          ],
        }],
      },
      makeDeps()
    );
    const sub100 = result.lines.find((l) => l.subAccountId === 100);
    const sub101 = result.lines.find((l) => l.subAccountId === 101);
    const parentTotal = sub100.endingBalance + sub101.endingBalance;
    // Parent 3010000 is C-nature per existing dc(); both subs inherit C-nature.
    // sub100: opening 200 + 0 + 30 = 230 (C: opening - debit + credit)
    // sub101: opening 300 - 40 + 0 = 260
    assert.equal(sub100.endingBalance, 230);
    assert.equal(sub101.endingBalance, 260);
    assert.equal(parentTotal, 490, 'sub-account lines sum to parent effective total');
  });

  it('reads opening from AccountRemaining at the same term (no off-by-one)', async () => {
    // accountRemaining for account 1 is stored at term 1 with balance 100.
    const result = await balanceEngine(
      { tenantId: TENANT_A, term: 1, entrySources: [] },
      makeDeps()
    );
    const cash = result.lines.find((l) => l.code === '1110000');
    assert.equal(cash.openingBalance, 100, 'opening read at term=1, not term-1');
  });

  it('normalizes accountCode field (Sequelize model uses accountCode, not code)', async () => {
    const seqAccounts = [
      { id: 1, accountCode: '1110000', tenantId: TENANT_A, subAccounts: [] },
    ];
    const deps = {
      Account: { findAll: async () => seqAccounts },
      SubAccount: {},
      AccountRemaining: { findAll: async () => [
        { accountId: 1, term: 1, debit: 0, credit: 0, balance: 500, tenantId: TENANT_A },
      ]},
      SubAccountRemaining: { findAll: async () => [] },
    };
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        entrySources: [{
          name: 'actual',
          fetch: async () => [{ debitAccount: '1110000', debitAmount: 50, ...APPROVED }],
        }],
      },
      deps
    );
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].code, '1110000');
    assert.equal(result.lines[0].openingBalance, 500);
    assert.equal(result.lines[0].movementDebit, 50);
    assert.equal(result.lines[0].endingBalance, 550, 'D-nature: 500 + 50 - 0');
  });

  it('subAccount:false rolls sub-account movement up to the parent account line', async () => {
    const result = await balanceEngine(
      {
        tenantId: TENANT_A,
        term: 1,
        options: { subAccount: false },
        entrySources: [{
          name: 'actual',
          fetch: async () => [
            { creditAccount: '3010000', creditSubAccount: 100, creditAmount: 30, ...APPROVED },
            { debitAccount: '3010000', debitSubAccount: 101, debitAmount: 40, ...APPROVED },
          ],
        }],
      },
      makeDeps()
    );
    const parent = result.lines.find((l) => l.code === '3010000');
    assert.equal(parent.subAccountId, null, 'one account-level line, no sub lines');
    assert.equal(result.lines.filter((l) => l.code === '3010000').length, 1);
    assert.equal(parent.movementCredit, 30, 'sub movements rolled into parent');
    assert.equal(parent.movementDebit, 40);
  });
});
