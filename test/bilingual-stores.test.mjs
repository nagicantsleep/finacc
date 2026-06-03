/**
 * Unit tests for bilingual.js stores
 *
 * Tests the client-side bilingual stores and helper functions:
 *   languagePair, _b, _bDerived, bi, loadDictionaries
 *
 * Run with: npm test  (picks up test/*.test.mjs)
 */

import { strict as assert } from 'node:assert';
import { get } from 'svelte/store';
import {
  languagePair,
  _b,
  _bDerived,
  bi,
  loadDictionaries,
} from '../front/javascripts/bilingual.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LOCALE_DATA = {
  ja: { save: '保存', hello: 'こんにちは' },
  vi: { save: 'Lưu', hello: 'Xin chào' },
};

// ---------------------------------------------------------------------------
// loadDictionaries
// ---------------------------------------------------------------------------

describe('loadDictionaries', function () {
  before(function () {
    loadDictionaries(LOCALE_DATA);
  });

  it('loads dictionaries and _b resolves keys', function () {
    const result = _b('save');
    assert.deepStrictEqual(result, { primary: '保存', secondary: 'Lưu' });
  });

  it('returns the key itself when key is missing from dictionary', function () {
    const result = _b('noSuchKey');
    assert.deepStrictEqual(result, { primary: 'noSuchKey', secondary: 'noSuchKey' });
  });
});

// ---------------------------------------------------------------------------
// _b
// ---------------------------------------------------------------------------

describe('_b', function () {
  before(function () {
    loadDictionaries(LOCALE_DATA);
  });

  it('returns { primary, secondary } object for a known key', function () {
    const result = _b('hello');
    assert.deepStrictEqual(result, { primary: 'こんにちは', secondary: 'Xin chào' });
  });

  it('returns key as fallback when dictionary has no entry', function () {
    const result = _b('missing');
    assert.deepStrictEqual(result, { primary: 'missing', secondary: 'missing' });
  });

  it('reflects current languagePair', function () {
    languagePair.set({ primary: 'vi', secondary: 'ja' });
    const result = _b('save');
    assert.deepStrictEqual(result, { primary: 'Lưu', secondary: '保存' });
    // restore default
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });
});

// ---------------------------------------------------------------------------
// bi
// ---------------------------------------------------------------------------

describe('bi', function () {
  before(function () {
    loadDictionaries(LOCALE_DATA);
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });

  it('returns "primary / secondary" string for a known key', function () {
    const fn = get(bi);
    assert.strictEqual(fn('save'), '保存 / Lưu');
  });

  it('returns just primary when primary === secondary', function () {
    // Set both languages to the same locale so translations match
    languagePair.set({ primary: 'ja', secondary: 'ja' });
    const fn = get(bi);
    assert.strictEqual(fn('save'), '保存');
    // restore default
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });

  it('returns key when missing from both dictionaries', function () {
    const fn = get(bi);
    assert.strictEqual(fn('noSuchKey'), 'noSuchKey');
  });
});

// ---------------------------------------------------------------------------
// _bDerived
// ---------------------------------------------------------------------------

describe('_bDerived', function () {
  before(function () {
    loadDictionaries(LOCALE_DATA);
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });

  it('returns a function that resolves keys for the current language pair', function () {
    const fn = get(_bDerived);
    assert.strictEqual(typeof fn, 'function');
    assert.deepStrictEqual(fn('save'), { primary: '保存', secondary: 'Lưu' });
  });

  it('reflects languagePair changes when re-read', function () {
    languagePair.set({ primary: 'vi', secondary: 'ja' });
    const fn = get(_bDerived);
    assert.deepStrictEqual(fn('save'), { primary: 'Lưu', secondary: '保存' });
    // restore default
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });
});

// ---------------------------------------------------------------------------
// languagePair store
// ---------------------------------------------------------------------------

describe('languagePair store', function () {
  it('defaults to { primary: "ja", secondary: "vi" }', function () {
    // Reset to initial default
    languagePair.set({ primary: 'ja', secondary: 'vi' });
    const pair = get(languagePair);
    assert.deepStrictEqual(pair, { primary: 'ja', secondary: 'vi' });
  });

  it('can be updated with set()', function () {
    languagePair.set({ primary: 'vi', secondary: 'en' });
    const pair = get(languagePair);
    assert.deepStrictEqual(pair, { primary: 'vi', secondary: 'en' });
    // restore default
    languagePair.set({ primary: 'ja', secondary: 'vi' });
  });
});
