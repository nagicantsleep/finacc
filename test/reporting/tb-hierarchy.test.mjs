/**
 * Unit tests — Issue #210 (E1.4): libs/reporting/tb-hierarchy.js
 *
 * Run with: npx mocha test/reporting/tb-hierarchy.test.mjs
 */

import { strict as assert } from 'node:assert';
import { withAccountParents, applyExpandCollapse, indentClass } from '../../libs/reporting/tb-hierarchy.js';

const line = (over) => ({
  type: 'account',
  accountId: 1, code: '0000000',
  name: 'x', nameVi: null,
  subAccountId: null, subCode: null, subName: null, subNameVi: null,
  major: 'M', middle: 'M1', minor: 'm',
  majorVi: null, middleVi: null, minorVi: null,
  openingDebit: 0, openingCredit: 0,
  movementDebit: 0, movementCredit: 0,
  endingDebit: 0, endingCredit: 0,
  balance: 0,
  warningCodes: [],
  ...over,
});

// ---------------------------------------------------------------------------
// withAccountParents
// ---------------------------------------------------------------------------

describe('withAccountParents', () => {
  it('inserts a parent row above a single subAccount cluster', () => {
    const out = withAccountParents([
      line({ type: 'subAccount', code: '3050000', subAccountId: 100, subCode: 1, name: '買掛金', subName: 'A社' }),
    ]);
    assert.equal(out.length, 2);
    assert.equal(out[0].type, 'parent');
    assert.equal(out[0].code, '3050000');
    assert.equal(out[0].name, '買掛金');
    assert.equal(out[0].isParent, true);
    assert.equal(out[1].type, 'subAccount');
  });

  it('inserts one parent per cluster of subs sharing the same code', () => {
    const out = withAccountParents([
      line({ type: 'subAccount', code: '3050000', subCode: 1, name: '買掛金' }),
      line({ type: 'subAccount', code: '3050000', subCode: 2, name: '買掛金' }),
      line({ type: 'subAccount', code: '3050000', subCode: 3, name: '買掛金' }),
    ]);
    const parents = out.filter((l) => l.type === 'parent');
    assert.equal(parents.length, 1, 'one parent for 3 subs of the same account');
    assert.equal(parents[0].code, '3050000');
  });

  it('inserts separate parents for different account codes', () => {
    const out = withAccountParents([
      line({ type: 'subAccount', code: '3050000', subCode: 1, name: '買掛金' }),
      line({ type: 'subAccount', code: '3050000', subCode: 2, name: '買掛金' }),
      line({ type: 'subAccount', code: '7030020', subCode: 1, name: '経費' }),
    ]);
    const parents = out.filter((l) => l.type === 'parent');
    assert.equal(parents.length, 2);
    assert.deepEqual(parents.map((p) => p.code), ['3050000', '7030020']);
  });

  it('does not insert parent for standalone account lines', () => {
    const out = withAccountParents([
      line({ type: 'account', code: '1000000', name: '現金' }),
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].type, 'account');
  });

  it('mixed: account + subAccount cluster + standalone account', () => {
    const out = withAccountParents([
      line({ type: 'account', code: '1000000', name: '現金' }),
      line({ type: 'subAccount', code: '3050000', subCode: 1, name: '買掛金' }),
      line({ type: 'account', code: '3000000', name: '資本金' }),
    ]);
    const types = out.map((l) => l.type);
    assert.deepEqual(types, ['account', 'parent', 'subAccount', 'account']);
    assert.equal(out[1].code, '3050000');
  });

  it('subAccount cluster split by subtotal → separate parents', () => {
    // Theoretically unlikely after buildSubtotals, but the helper is defensive.
    const out = withAccountParents([
      line({ type: 'subAccount', code: '3050000', subCode: 1, name: '買掛金' }),
      line({ type: 'subtotal', level: 'minor', name: 'X' }),
      line({ type: 'subAccount', code: '3050000', subCode: 2, name: '買掛金' }),
    ]);
    const parents = out.filter((l) => l.type === 'parent');
    assert.equal(parents.length, 2, 'split cluster → 2 parents');
  });

  it('non-array input → empty output', () => {
    assert.deepEqual(withAccountParents(null), []);
  });

  it('parent row carries the account class fields from the sub', () => {
    const out = withAccountParents([
      line({ type: 'subAccount', code: '3050000', subCode: 1, name: '買掛金',
        major: '負債', middle: '流動負債', minor: '買掛金',
        majorVi: 'Nợ', middleVi: 'Nợ ngắn hạn', minorVi: 'Phải trả',
        accountClassId: 20, aclCode: '305' }),
    ]);
    const p = out[0];
    assert.equal(p.major, '負債');
    assert.equal(p.minorVi, 'Phải trả');
    assert.equal(p.accountClassId, 20);
    assert.equal(p.aclCode, '305');
  });
});

// ---------------------------------------------------------------------------
// applyExpandCollapse
// ---------------------------------------------------------------------------

describe('applyExpandCollapse', () => {
  const sample = [
    line({ type: 'parent', code: '3050000' }),
    line({ type: 'subAccount', code: '3050000', subCode: 1 }),
    line({ type: 'subAccount', code: '3050000', subCode: 2 }),
    line({ type: 'parent', code: '7030020' }),
    line({ type: 'subAccount', code: '7030020', subCode: 1 }),
    line({ type: 'subAccount', code: '7030020', subCode: 2 }),
    line({ type: 'subAccount', code: '7030020', subCode: 3 }),
    line({ type: 'account', code: '1000000' }),
  ];

  it('expanded = empty: hides all sub rows, keeps parents + accounts', () => {
    const out = applyExpandCollapse(sample, new Set());
    assert.equal(out.length, 3, 'parent(3050000), parent(7030020), account(1000000)');
    assert.deepEqual(out.map((l) => l.code), ['3050000', '7030020', '1000000']);
  });

  it('expanded = {3050000}: shows subs only for 3050000', () => {
    const out = applyExpandCollapse(sample, new Set(['3050000']));
    assert.equal(out.length, 5, 'parent(3050000) + 2 subs + parent(7030020) + account(1000000)');
    const subs = out.filter((l) => l.type === 'subAccount');
    assert.equal(subs.length, 2);
    assert.ok(subs.every((l) => l.code === '3050000'));
  });

  it('expanded = all: passes everything through', () => {
    const out = applyExpandCollapse(sample, new Set(['3050000', '7030020']));
    assert.equal(out.length, sample.length);
  });

  it('orphan subAccount (no code) is always hidden', () => {
    const orphan = line({ type: 'subAccount', code: null });
    const out = applyExpandCollapse([orphan, ...sample], new Set(['3050000', '7030020']));
    assert.ok(!out.includes(orphan));
  });

  it('non-Set expanded → treated as empty (collapsed)', () => {
    const out = applyExpandCollapse(sample, null);
    assert.equal(out.length, 3);
  });

  it('non-array input → empty output', () => {
    assert.deepEqual(applyExpandCollapse(null, new Set()), []);
  });
});

// ---------------------------------------------------------------------------
// indentClass
// ---------------------------------------------------------------------------

describe('indentClass', () => {
  it('major subtotal → indent-0', () => {
    assert.equal(indentClass({ type: 'subtotal', level: 'major' }), 'tb-indent-0');
  });
  it('middle subtotal → indent-1', () => {
    assert.equal(indentClass({ type: 'subtotal', level: 'middle' }), 'tb-indent-1');
  });
  it('minor subtotal → indent-2', () => {
    assert.equal(indentClass({ type: 'subtotal', level: 'minor' }), 'tb-indent-2');
  });
  it('parent (勘定) → indent-3', () => {
    assert.equal(indentClass({ type: 'parent' }), 'tb-indent-3');
  });
  it('standalone account → indent-3', () => {
    assert.equal(indentClass({ type: 'account' }), 'tb-indent-3');
  });
  it('subAccount (補助) → indent-4', () => {
    assert.equal(indentClass({ type: 'subAccount' }), 'tb-indent-4');
  });
  it('null/undefined → indent-0', () => {
    assert.equal(indentClass(null), 'tb-indent-0');
    assert.equal(indentClass(undefined), 'tb-indent-0');
  });
});
