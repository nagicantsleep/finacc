/**
 * Unit tests — Issue #212 (E1.6): libs/reporting/warning-rules.js
 *
 * Run with: npx mocha test/reporting/warning-rules.test.mjs
 */

import { strict as assert } from 'node:assert';
import {
  runWarningRules,
  splitBannerAndLine,
  applyLineWarningCodes,
  isCashOrBank,
  CASH_BANK_PREFIXES,
} from '../../libs/reporting/warning-rules.js';

const meta = (over = {}) => ({
  tenantId: 1,
  term: 1,
  totals: { movementDebit: 0, movementCredit: 0, openingDebit: 0, openingCredit: 0, endingDebit: 0, endingCredit: 0 },
  ...over,
});

const line = (over) => ({
  type: 'account',
  code: '0000000', subCode: null,
  endingDebit: 0, endingCredit: 0,
  warningCodes: [],
  ...over,
});

// ---------------------------------------------------------------------------
// CASH_BANK_PREFIXES
// ---------------------------------------------------------------------------

describe('CASH_BANK_PREFIXES', () => {
  it('treats 1000000 (現金) and 1010000 (普通預金) as cash/bank', () => {
    assert.ok(isCashOrBank(line({ code: '1000000' })));
    assert.ok(isCashOrBank(line({ code: '1010000' })));
  });
  it('does NOT treat 3000000 (資本金) as cash/bank', () => {
    assert.ok(!isCashOrBank(line({ code: '3000000' })));
  });
  it('handles sub-account line on cash/bank parent', () => {
    assert.ok(isCashOrBank(line({ code: '1000000', type: 'subAccount', subCode: 1 })));
  });
  it('null/empty code → false', () => {
    assert.ok(!isCashOrBank(line({ code: null })));
    assert.ok(!isCashOrBank(line({ code: '' })));
  });
});

// ---------------------------------------------------------------------------
// TB-W001 — movement debit ≠ credit
// ---------------------------------------------------------------------------

describe('TB-W001', () => {
  it('fires when movementDebit !== movementCredit', async () => {
    const m = meta({ totals: { movementDebit: 100, movementCredit: 90 } });
    const out = await runWarningRules({ lines: [], meta: m, deps: {} });
    const w001 = out.find((m) => m.code === 'TB-W001');
    assert.ok(w001);
    assert.equal(w001.severity, 'critical');
    assert.equal(w001.detail.diff, 10);
  });

  it('does NOT fire when totals balance', async () => {
    const m = meta({ totals: { movementDebit: 100, movementCredit: 100 } });
    const out = await runWarningRules({ lines: [], meta: m, deps: {} });
    assert.ok(!out.some((m) => m.code === 'TB-W001'));
  });

  it('missing totals → does not throw, no W001', async () => {
    const m = { tenantId: 1, term: 1 };
    const out = await runWarningRules({ lines: [], meta: m, deps: {} });
    assert.ok(!out.some((m) => m.code === 'TB-W001'));
  });
});

// ---------------------------------------------------------------------------
// TB-W002 — unapproved CrossSlip
// ---------------------------------------------------------------------------

describe('TB-W002', () => {
  it('fires when CrossSlip.count(...) returns > 0', async () => {
    const deps = { CrossSlip: { count: async () => 5 } };
    const m = meta();
    const out = await runWarningRules({ lines: [], meta: m, deps });
    const w002 = out.find((m) => m.code === 'TB-W002');
    assert.ok(w002);
    assert.equal(w002.severity, 'high');
    assert.equal(w002.detail.count, 5);
  });

  it('does NOT fire when count is 0', async () => {
    const deps = { CrossSlip: { count: async () => 0 } };
    const out = await runWarningRules({ lines: [], meta: meta(), deps });
    assert.ok(!out.some((m) => m.code === 'TB-W002'));
  });

  it('missing CrossSlip dep → no W002 (does not throw)', async () => {
    const out = await runWarningRules({ lines: [], meta: meta(), deps: {} });
    assert.ok(!out.some((m) => m.code === 'TB-W002'));
  });
});

// ---------------------------------------------------------------------------
// TB-W005 — cash/bank negative ending
// ---------------------------------------------------------------------------

describe('TB-W005', () => {
  it('fires for cash account with endingDebit < endingCredit', async () => {
    const lines = [
      line({ code: '1000000', endingDebit: 0, endingCredit: 50, balance: -50 }),
      line({ code: '3000000', endingDebit: 0, endingCredit: 0 }),
    ];
    const out = await runWarningRules({ lines, meta: meta(), deps: {} });
    const w005 = out.find((m) => m.code === 'TB-W005');
    assert.ok(w005);
    assert.equal(w005.severity, 'medium');
    assert.equal(w005.lineCode, '1000000');
    assert.equal(w005.lineSubCode, null);
  });

  it('does NOT fire when cash account has positive ending', async () => {
    const lines = [
      line({ code: '1000000', endingDebit: 100, endingCredit: 0, balance: 100 }),
    ];
    const out = await runWarningRules({ lines, meta: meta(), deps: {} });
    assert.ok(!out.some((m) => m.code === 'TB-W005'));
  });

  it('does NOT fire for non-cash negative accounts', async () => {
    const lines = [
      line({ code: '3000000', endingDebit: 0, endingCredit: 200, balance: -200 }),
    ];
    const out = await runWarningRules({ lines, meta: meta(), deps: {} });
    assert.ok(!out.some((m) => m.code === 'TB-W005'));
  });

  it('fires for subAccount line under cash parent', async () => {
    const lines = [
      line({ type: 'subAccount', code: '1010000', subCode: 1, endingDebit: 0, endingCredit: 10 }),
    ];
    const out = await runWarningRules({ lines, meta: meta(), deps: {} });
    const w005 = out.find((m) => m.code === 'TB-W005');
    assert.ok(w005);
    assert.equal(w005.lineCode, '1010000');
    assert.equal(w005.lineSubCode, 1);
  });
});

// ---------------------------------------------------------------------------
// splitBannerAndLine + applyLineWarningCodes
// ---------------------------------------------------------------------------

describe('splitBannerAndLine', () => {
  it('separates banner and per-line messages', () => {
    const messages = [
      { code: 'TB-W001', severity: 'critical' },
      { code: 'TB-W005', severity: 'medium', lineCode: '1000000', lineSubCode: null },
      { code: 'TB-W005', severity: 'medium', lineCode: '1010000', lineSubCode: 2 },
    ];
    const { banners, byLineKey } = splitBannerAndLine(messages);
    assert.equal(banners.length, 1);
    assert.equal(banners[0].code, 'TB-W001');
    assert.equal(byLineKey.size, 2);
    assert.deepEqual(byLineKey.get('1000000|'), ['TB-W005']);
    assert.deepEqual(byLineKey.get('1010000|2'), ['TB-W005']);
  });
});

describe('applyLineWarningCodes', () => {
  const lines = [
    line({ code: '1000000' }),
    line({ code: '1010000', subCode: 2, type: 'subAccount' }),
  ];

  it('stamps matching codes onto the right lines', () => {
    const byLineKey = new Map([
      ['1000000|', ['TB-W005']],
      ['1010000|2', ['TB-W005']],
    ]);
    const out = applyLineWarningCodes(lines, byLineKey);
    assert.deepEqual(out[0].warningCodes, ['TB-W005']);
    assert.deepEqual(out[1].warningCodes, ['TB-W005']);
  });

  it('preserves existing warningCodes (does not clobber)', () => {
    const linesWithExisting = [
      line({ code: '1000000', warningCodes: ['TB-W001'] }),
    ];
    const byLineKey = new Map([['1000000|', ['TB-W005']]]);
    const out = applyLineWarningCodes(linesWithExisting, byLineKey);
    assert.deepEqual(out[0].warningCodes, ['TB-W001', 'TB-W005']);
  });

  it('lines not in byLineKey → unchanged', () => {
    const byLineKey = new Map();
    const out = applyLineWarningCodes(lines, byLineKey);
    assert.deepEqual(out[0].warningCodes, []);
    assert.deepEqual(out[1].warningCodes, []);
  });
});

// ---------------------------------------------------------------------------
// Integration with v2 (smoke)
// ---------------------------------------------------------------------------

describe('rules error handling', () => {
  it('a rule throwing is reported as banner, does not fail others', async () => {
    const badRule = {
      id: 'TB-XXX',
      severity: 'low',
      title: 't',
      titleVi: 't',
      evaluate: () => { throw new Error('boom'); },
    };
    // Import the internal list indirectly by running it through runWarningRules
    // after temporarily injecting. Use a fresh call: inject into the rules list
    // by monkey-patching won't work here. Instead, simulate by passing a
    // deliberately broken deps.
    const deps = {
      CrossSlip: {
        count: async () => { throw new Error('db down'); },
      },
    };
    const m = meta();
    const out = await runWarningRules({ lines: [], meta: m, deps });
    const w002 = out.find((m) => m.code === 'TB-W002');
    assert.ok(w002);
    assert.match(w002.detail.error, /db down/);
  });
});
