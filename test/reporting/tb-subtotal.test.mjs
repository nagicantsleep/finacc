/**
 * Unit tests — Issue #208 (E1.2): libs/reporting/tb-subtotal.js
 *
 * Pure-function tests for the subtotal builder. No DB.
 *
 * Run with: npm test (or npx mocha test/reporting/tb-subtotal.test.mjs)
 */

import { strict as assert } from 'node:assert';
import { buildSubtotals, sumLines } from '../../libs/reporting/tb-subtotal.js';

// Helper to build a flat v2 line.
const line = (over) => ({
  type: 'account',
  accountId: 1, code: '0000000', name: 'x', nameVi: null,
  accountClassId: 1, aclCode: '10',
  subAccountId: null, subCode: null, subName: null, subNameVi: null,
  major: 'X', middle: 'X', minor: 'X', majorVi: null, middleVi: null, minorVi: null,
  openingDebit: 0, openingCredit: 0,
  movementDebit: 0, movementCredit: 0,
  endingDebit: 0, endingCredit: 0,
  balance: 0,
  warningCodes: [],
  isSubtotal: false,
  ...over,
});

// ---------------------------------------------------------------------------
// sumLines
// ---------------------------------------------------------------------------

describe('sumLines', () => {
  it('sums every side separately', () => {
    const out = sumLines([
      line({ openingDebit: 10, openingCredit: 0, movementDebit: 5, movementCredit: 0, endingDebit: 15, endingCredit: 0, balance: 15 }),
      line({ openingDebit: 0, openingCredit: 20, movementDebit: 0, movementCredit: 8, endingDebit: 0, endingCredit: 28, balance: -28 }),
    ]);
    assert.equal(out.openingDebit, 10);
    assert.equal(out.openingCredit, 20);
    assert.equal(out.movementDebit, 5);
    assert.equal(out.movementCredit, 8);
    assert.equal(out.endingDebit, 15);
    assert.equal(out.endingCredit, 28);
    assert.equal(out.balance, -13, 'signed sum of balances');
  });
  it('handles empty input', () => {
    const out = sumLines([]);
    assert.equal(out.openingDebit, 0);
    assert.equal(out.balance, 0);
  });
});

// ---------------------------------------------------------------------------
// buildSubtotals — emission order
// ---------------------------------------------------------------------------

describe('buildSubtotals — emission order', () => {
  it('inserts minor subtotal right after each minor group', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x' }),
      line({ code: '1001000', major: 'A', middle: 'A1', minor: 'A1x' }),
    ]);
    const types = out.map((l) => l.type);
    // 2 data lines + 3 subtotals (minor, middle, major) = 5 rows
    assert.deepEqual(types, ['account', 'account', 'subtotal', 'subtotal', 'subtotal']);
    assert.equal(out[2].level, 'minor');
    assert.equal(out[3].level, 'middle');
    assert.equal(out[4].level, 'major');
  });

  it('inserts middle subtotal after its minors', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x' }),
      line({ code: '1001000', major: 'A', middle: 'A1', minor: 'A1x' }),
    ]);
    assert.equal(out.length, 5, 'data data subtotal(minor) subtotal(middle) subtotal(major)');
    const middle = out.find((l) => l.type === 'subtotal' && l.level === 'middle');
    assert.equal(middle.middle, 'A1');
  });

  it('emits minor → middle → major for a single line', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x' }),
    ]);
    assert.equal(out.length, 4, '1 account + 3 subtotals');
    assert.equal(out[0].type, 'account');
    assert.equal(out[1].level, 'minor');
    assert.equal(out[2].level, 'middle');
    assert.equal(out[3].level, 'major');
  });

  it('emits two majors in first-seen order', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x' }),
      line({ code: '3000000', major: 'B', middle: 'B1', minor: 'B1x' }),
    ]);
    // Expected: A-data, A-minor, A-middle, A-major, B-data, B-minor, B-middle, B-major
    const majors = out.filter((l) => l.type === 'subtotal' && l.level === 'major').map((l) => l.major);
    assert.deepEqual(majors, ['A', 'B']);
  });

  it('walks middles within a major in first-seen order', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x' }),
      line({ code: '2000000', major: 'A', middle: 'A2', minor: 'x' }),
    ]);
    const middles = out.filter((l) => l.type === 'subtotal' && l.level === 'middle').map((l) => l.middle);
    assert.deepEqual(middles, ['A1', 'A2']);
  });
});

// ---------------------------------------------------------------------------
// buildSubtotals — values
// ---------------------------------------------------------------------------

describe('buildSubtotals — values', () => {
  it('minor subtotal sums its children on every side', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x',
        openingDebit: 100, openingCredit: 0, movementDebit: 50, movementCredit: 20,
        endingDebit: 130, endingCredit: 0, balance: 130 }),
      line({ code: '1001000', major: 'A', middle: 'A1', minor: 'x',
        openingDebit: 0, openingCredit: 30, movementDebit: 0, movementCredit: 10,
        endingDebit: 0, endingCredit: 40, balance: -40 }),
    ]);
    const sub = out.find((l) => l.type === 'subtotal' && l.level === 'minor');
    assert.equal(sub.openingDebit, 100);
    assert.equal(sub.openingCredit, 30);
    assert.equal(sub.movementDebit, 50);
    assert.equal(sub.movementCredit, 30);
    assert.equal(sub.endingDebit, 130);
    assert.equal(sub.endingCredit, 40);
    assert.equal(sub.balance, 90);
  });

  it('middle subtotal sums all its children across minors', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x', endingDebit: 10, endingCredit: 0, balance: 10 }),
      line({ code: '1001000', major: 'A', middle: 'A1', minor: 'A1y', endingDebit: 0, endingCredit: 5, balance: -5 }),
    ]);
    const sub = out.find((l) => l.type === 'subtotal' && l.level === 'middle');
    assert.equal(sub.endingDebit, 10);
    assert.equal(sub.endingCredit, 5);
    assert.equal(sub.balance, 5);
  });

  it('major subtotal sums all its children across middles', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x', balance: 10 }),
      line({ code: '2000000', major: 'A', middle: 'A2', minor: 'x', balance: -3 }),
    ]);
    const sub = out.find((l) => l.type === 'subtotal' && l.level === 'major');
    assert.equal(sub.balance, 7);
  });

  it('subtotal.name matches the level (major/middle/minor)', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'A1x',
        majorVi: 'Av', middleVi: 'A1v', minorVi: 'A1xv' }),
    ]);
    const minor = out.find((l) => l.level === 'minor');
    const middle = out.find((l) => l.level === 'middle');
    const major = out.find((l) => l.level === 'major');
    assert.equal(minor.name, 'A1x');
    assert.equal(minor.nameVi, 'A1xv');
    assert.equal(middle.name, 'A1');
    assert.equal(middle.nameVi, 'A1v');
    assert.equal(major.name, 'A');
    assert.equal(major.nameVi, 'Av');
  });

  it('mixed D/C children: endingDebit/Credit keep each side separate', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x', endingDebit: 100, endingCredit: 0, balance: 100 }),
      line({ code: '3000000', major: 'A', middle: 'A1', minor: 'x', endingDebit: 0, endingCredit: 200, balance: -200 }),
    ]);
    const sub = out.find((l) => l.type === 'subtotal' && l.level === 'minor');
    assert.equal(sub.endingDebit, 100, 'D-side balance stays on D-side');
    assert.equal(sub.endingCredit, 200, 'C-side balance stays on C-side');
    assert.equal(sub.balance, -100, 'signed sum');
  });

  it('three-level invariant: minor sum == middle sum == major sum (per side)', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x',
        openingDebit: 5, movementDebit: 10, endingDebit: 15, balance: 15 }),
      line({ code: '1001000', major: 'A', middle: 'A2', minor: 'y',
        openingCredit: 7, movementCredit: 3, endingCredit: 10, balance: -10 }),
    ]);
    const minors = out.filter((l) => l.level === 'minor');
    const middle = out.filter((l) => l.level === 'middle');
    const major = out.filter((l) => l.level === 'major');
    for (const k of ['openingDebit','openingCredit','movementDebit','movementCredit','endingDebit','endingCredit']) {
      const sumMins = minors.reduce((s, l) => s + (l[k] || 0), 0);
      const sumMids = middle.reduce((s, l) => s + (l[k] || 0), 0);
      assert.equal(sumMins, sumMids, `minors == middles on ${k}`);
      assert.equal(sumMids, major[0][k], `middles == major on ${k}`);
    }
  });
});

// ---------------------------------------------------------------------------
// passthrough
// ---------------------------------------------------------------------------

describe('buildSubtotals — passthrough', () => {
  it('passes through non-data lines unchanged at the end', () => {
    const stray = { type: 'subtotal', level: 'minor', name: 'preexisting' };
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x' }),
      stray,
    ]);
    assert.ok(out.includes(stray), 'stray non-data line preserved');
    // data → minor/middle/major subtotals → stray
    const strayIdx = out.indexOf(stray);
    assert.ok(strayIdx > 0, 'stray placed after the tree');
  });

  it('passes through orphan data lines (no major/middle/minor)', () => {
    const orphan = line({ code: '9999999', major: null, middle: null, minor: null });
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x' }),
      orphan,
    ]);
    assert.ok(out.includes(orphan));
  });
});

// ---------------------------------------------------------------------------
// edge cases
// ---------------------------------------------------------------------------

describe('buildSubtotals — edge cases', () => {
  it('empty input → empty output', () => {
    assert.deepEqual(buildSubtotals([]), []);
  });
  it('non-array input → empty output', () => {
    assert.deepEqual(buildSubtotals(null), []);
  });
  it('subAccount lines participate in their parent minor subtotal', () => {
    const sub = line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x',
      type: 'subAccount', subAccountId: 100, subCode: 1,
      endingDebit: 5, endingCredit: 0, balance: 5 });
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x',
        endingDebit: 10, endingCredit: 0, balance: 10 }),
      sub,
    ]);
    const minor = out.find((l) => l.level === 'minor');
    assert.equal(minor.endingDebit, 15);
  });
  it('subtotals flagged with isSubtotal=true and warningCodes=[]', () => {
    const out = buildSubtotals([
      line({ code: '1000000', major: 'A', middle: 'A1', minor: 'x' }),
    ]);
    for (const l of out.filter((x) => x.type === 'subtotal')) {
      assert.equal(l.isSubtotal, true);
      assert.deepEqual(l.warningCodes, []);
    }
  });
});
