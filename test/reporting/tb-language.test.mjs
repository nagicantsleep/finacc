/**
 * Unit tests — Issue #215 (E1.9): libs/reporting/tb-language.js
 *
 * Run with: npx mocha test/reporting/tb-language.test.mjs
 */

import { strict as assert } from 'node:assert';
import {
  pickDisplayName,
  languagePairForMode,
  languagePairQuery,
  LANG_MODES,
  pickFallback,
} from '../../libs/reporting/tb-language.js';

// ---------------------------------------------------------------------------
// pickDisplayName
// ---------------------------------------------------------------------------

describe('pickDisplayName', () => {
  it('ja mode: returns name, no secondary', () => {
    const out = pickDisplayName({ name: '現金', nameVi: 'Tiền mặt', code: '1000000' }, 'ja');
    assert.equal(out.primary, '現金');
    assert.equal(out.secondary, null);
  });

  it('vi mode: returns nameVi (fallback to name if no vi)', () => {
    const out1 = pickDisplayName({ name: '現金', nameVi: 'Tiền mặt', code: '1000000' }, 'vi');
    assert.equal(out1.primary, 'Tiền mặt');
    assert.equal(out1.secondary, null);
    const out2 = pickDisplayName({ name: '現金', nameVi: null, code: '1000000' }, 'vi');
    assert.equal(out2.primary, '現金', 'fallback to name');
    const out3 = pickDisplayName({ name: null, nameVi: null, code: '1000000' }, 'vi');
    assert.equal(out3.primary, '1000000', 'fallback to code');
  });

  it('ja-vi mode: primary ja, secondary vi (vi missing → secondary null)', () => {
    const out = pickDisplayName({ name: '現金', nameVi: null, code: '1000000' }, 'ja-vi');
    assert.equal(out.primary, '現金');
    assert.equal(out.secondary, null);
  });

  it('ja-vi mode: both present', () => {
    const out = pickDisplayName({ name: '現金', nameVi: 'Tiền mặt', code: '1000000' }, 'ja-vi');
    assert.equal(out.primary, '現金');
    assert.equal(out.secondary, 'Tiền mặt');
  });

  it('vi-ja mode: primary vi, secondary ja', () => {
    const out = pickDisplayName({ name: '現金', nameVi: 'Tiền mặt', code: '1000000' }, 'vi-ja');
    assert.equal(out.primary, 'Tiền mặt');
    assert.equal(out.secondary, '現金');
  });

  it('vi-ja mode: vi missing → primary falls back to name', () => {
    const out = pickDisplayName({ name: '現金', nameVi: null, code: '1000000' }, 'vi-ja');
    assert.equal(out.primary, '現金');
    assert.equal(out.secondary, '現金', 'secondary also ja');
  });

  it('vi-ja mode: both missing → primary = code', () => {
    const out = pickDisplayName({ name: null, nameVi: null, code: '9999' }, 'vi-ja');
    assert.equal(out.primary, '9999');
    assert.equal(out.secondary, null);
  });

  it('unknown mode → defaults to ja', () => {
    const out = pickDisplayName({ name: 'X', nameVi: 'Y', code: '0' }, 'xx');
    assert.equal(out.primary, 'X');
    assert.equal(out.secondary, null);
  });

  it('null line → empty primary', () => {
    const out = pickDisplayName(null, 'ja');
    assert.equal(out.primary, '');
  });
});

// ---------------------------------------------------------------------------
// languagePairForMode / languagePairQuery
// ---------------------------------------------------------------------------

describe('languagePairForMode', () => {
  it('ja → null', () => assert.equal(languagePairForMode('ja'), null));
  it('vi → { vi: "ja" }', () => assert.deepEqual(languagePairForMode('vi'), { vi: 'ja' }));
  it('ja-vi → { ja: "vi" }', () => assert.deepEqual(languagePairForMode('ja-vi'), { ja: 'vi' }));
  it('vi-ja → { vi: "ja" }', () => assert.deepEqual(languagePairForMode('vi-ja'), { vi: 'ja' }));
});

describe('languagePairQuery', () => {
  it('ja → null (no query param)', () => {
    assert.equal(languagePairQuery('ja'), null);
  });
  it('vi → JSON string', () => {
    assert.equal(languagePairQuery('vi'), JSON.stringify({ vi: 'ja' }));
  });
  it('ja-vi → JSON string', () => {
    assert.equal(languagePairQuery('ja-vi'), JSON.stringify({ ja: 'vi' }));
  });
});

// ---------------------------------------------------------------------------
// pickFallback + LANG_MODES
// ---------------------------------------------------------------------------

describe('pickFallback', () => {
  it('returns ja when present', () => {
    assert.equal(pickFallback('現金', 'Tiền', '1000000'), '現金');
  });
  it('falls back to vi when ja is null/empty', () => {
    assert.equal(pickFallback(null, 'Tiền', '1000000'), 'Tiền');
    assert.equal(pickFallback('', 'Tiền', '1000000'), 'Tiền');
  });
  it('falls back to code when both are null/empty', () => {
    assert.equal(pickFallback(null, null, '1000000'), '1000000');
    assert.equal(pickFallback('', '', '1000000'), '1000000');
  });
  it('returns empty string when everything is null', () => {
    assert.equal(pickFallback(null, null, null), '');
  });
});

describe('LANG_MODES', () => {
  it('lists the 4 supported modes', () => {
    assert.deepEqual(LANG_MODES, ['ja', 'vi', 'ja-vi', 'vi-ja']);
  });
});
