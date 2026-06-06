/**
 * Unit tests — bilingual-helper
 *
 * Tests enrichBilingual: translation enrichment for master-table records.
 * Models are mocked via test/mock-models.mjs (loaded with --import).
 *
 * Run with: node --import ./test/mock-models.mjs --test test/bilingual-helper.test.mjs
 */

import { strict as assert } from 'node:assert';
import bilingualHelper from '../libs/bilingual-helper.js';
import mockModels from '../models/index.js';

const {
  enrichBilingual,
  TRANSLATION_MAP,
  secondaryFieldSuffix,
  getEnrichedName,
  shapeAccountBilingual
} = bilingualHelper;


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock Sequelize model instance with setDataValue.
 * Uses a Proxy so that `rec.field` reads from internal data,
 * and `rec.setDataValue(key, val)` writes to it — matching real
 * Sequelize behaviour where `getDataValue` and property access
 * both resolve to the stored data.
 */
function mockRecord(props) {
  const data = { ...props };
  return new Proxy(data, {
    get(target, prop) {
      if (prop === 'setDataValue') return (key, value) => { target[key] = value; };
      if (prop === 'data') return target;
      if (prop === 'toJSON') return () => ({ ...target });
      if (prop === 'get') return (key) => target[key];
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) { return prop in target; },
    ownKeys(target) { return Reflect.ownKeys(target); },
    getOwnPropertyDescriptor(target, prop) {
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  });
}

/**
 * Temporarily replace Translation.findAll for a single test, restoring after.
 */
function withTranslations(rows, fn) {
  const original = mockModels.Translation.findAll;
  mockModels.Translation.findAll = async () => rows;
  return fn().finally(() => { mockModels.Translation.findAll = original; });
}

// ---------------------------------------------------------------------------
// Translation fixtures
// ---------------------------------------------------------------------------

const ACCOUNT_CLASS_TRANSLATIONS = [
  { tableName: 'AccountClass', recordKey: 'major:A',  field: 'major',  language: 'vi', value: 'Tai san' },
  { tableName: 'AccountClass', recordKey: 'middle:B', field: 'middle', language: 'vi', value: 'Tai san luu dong' },
  { tableName: 'AccountClass', recordKey: 'minor:C',  field: 'minor',  language: 'vi', value: 'Tien mat' },
];

const MULTI_RECORD_TRANSLATIONS = [
  { tableName: 'AccountClass', recordKey: 'major:A',  field: 'major',  language: 'vi', value: 'V1' },
  { tableName: 'AccountClass', recordKey: 'middle:X', field: 'middle', language: 'vi', value: 'V2' },
  { tableName: 'AccountClass', recordKey: 'minor:1',  field: 'minor',  language: 'vi', value: 'V3' },
  { tableName: 'AccountClass', recordKey: 'major:D',  field: 'major',  language: 'vi', value: 'V4' },
  { tableName: 'AccountClass', recordKey: 'middle:Y', field: 'middle', language: 'vi', value: 'V5' },
  { tableName: 'AccountClass', recordKey: 'minor:2',  field: 'minor',  language: 'vi', value: 'V6' },
];

const PARTIAL_TRANSLATIONS = [
  { tableName: 'AccountClass', recordKey: 'major:A', field: 'major', language: 'vi', value: 'Only major' },
];

// ---------------------------------------------------------------------------
// TRANSLATION_MAP shape
// ---------------------------------------------------------------------------

describe('TRANSLATION_MAP', function () {

  it('defines entries for all expected master tables', function () {
    const expectedTables = [
      'CompanyClass', 'ItemClass', 'TransactionKind',
      'VoucherClass', 'TaxRule', 'MemberClass', 'AccountClass',
    ];
    for (const table of expectedTables) {
      assert.ok(TRANSLATION_MAP[table], `missing entry for ${table}`);
    }
  });

  it('AccountClass maps major, middle, and minor fields', function () {
    const ac = TRANSLATION_MAP.AccountClass;
    assert.ok(ac.major, 'missing major mapper');
    assert.ok(ac.middle, 'missing middle mapper');
    assert.ok(ac.minor, 'missing minor mapper');
  });

  it('field mappers produce correct recordKey format', function () {
    const rec = { major: 'A', middle: 'B', minor: 'C' };
    assert.strictEqual(TRANSLATION_MAP.AccountClass.major(rec),  'major:A');
    assert.strictEqual(TRANSLATION_MAP.AccountClass.middle(rec), 'middle:B');
    assert.strictEqual(TRANSLATION_MAP.AccountClass.minor(rec),  'minor:C');
  });

  it('single-field table mappers produce correct recordKey format', function () {
    const companyRec = { name: 'Test' };
    assert.strictEqual(TRANSLATION_MAP.CompanyClass.name(companyRec), 'name:Test');

    const txRec = { label: 'Debit' };
    assert.strictEqual(TRANSLATION_MAP.TransactionKind.label(txRec), 'label:Debit');
  });
});

// ---------------------------------------------------------------------------
// enrichBilingual — early-exit paths
// ---------------------------------------------------------------------------

describe('enrichBilingual — early exits', function () {

  it('returns records unchanged when records is empty', async function () {
    const result = await enrichBilingual('AccountClass', [], { primary: 'ja', secondary: 'vi' });
    assert.deepStrictEqual(result, []);
  });

  it('returns records unchanged when records is null', async function () {
    const result = await enrichBilingual('AccountClass', null, { primary: 'ja', secondary: 'vi' });
    assert.strictEqual(result, null);
  });

  it('returns records unchanged when languagePair.secondary is missing', async function () {
    const records = [mockRecord({ name: 'X' })];
    const result = await enrichBilingual('CompanyClass', records, { primary: 'ja' });
    assert.strictEqual(result, records);
    assert.strictEqual(records[0].nameVi, undefined, 'should not add secondary field');
  });

  it('returns records unchanged when languagePair is null', async function () {
    const records = [mockRecord({ name: 'X' })];
    const result = await enrichBilingual('CompanyClass', records, null);
    assert.strictEqual(result, records);
  });

  it('returns records unchanged for unknown tableName', async function () {
    const records = [mockRecord({ name: 'X' })];
    const result = await enrichBilingual('NonExistentTable', records, { primary: 'ja', secondary: 'vi' });
    assert.strictEqual(result, records);
  });
});

// ---------------------------------------------------------------------------
// enrichBilingual — enrichment behaviour
// ---------------------------------------------------------------------------

describe('enrichBilingual — enrichment', function () {

  it('sets {field}Secondary on records when translations exist', async function () {
    const records = [mockRecord({ major: 'A', middle: 'B', minor: 'C' })];
    await withTranslations(ACCOUNT_CLASS_TRANSLATIONS, async () => {
      const result = await enrichBilingual('AccountClass', records, { primary: 'ja', secondary: 'vi' });
      assert.strictEqual(result[0].majorVi,  'Tai san');
      assert.strictEqual(result[0].middleVi, 'Tai san luu dong');
      assert.strictEqual(result[0].minorVi,  'Tien mat');
    });
  });

  it('handles multiple records with different keys', async function () {
    const records = [
      mockRecord({ major: 'A', middle: 'X', minor: '1' }),
      mockRecord({ major: 'D', middle: 'Y', minor: '2' }),
    ];
    await withTranslations(MULTI_RECORD_TRANSLATIONS, async () => {
      const result = await enrichBilingual('AccountClass', records, { primary: 'ja', secondary: 'vi' });
      assert.strictEqual(result[0].majorVi,  'V1');
      assert.strictEqual(result[0].middleVi, 'V2');
      assert.strictEqual(result[0].minorVi,  'V3');
      assert.strictEqual(result[1].majorVi,  'V4');
      assert.strictEqual(result[1].middleVi, 'V5');
      assert.strictEqual(result[1].minorVi,  'V6');
    });
  });

  it('skips fields with no translation (partial coverage)', async function () {
    const records = [mockRecord({ major: 'A', middle: 'B', minor: 'C' })];
    await withTranslations(PARTIAL_TRANSLATIONS, async () => {
      const result = await enrichBilingual('AccountClass', records, { primary: 'ja', secondary: 'vi' });
      assert.strictEqual(result[0].majorVi,  'Only major', 'major should be translated');
      assert.strictEqual(result[0].middleVi, undefined, 'middle should be skipped');
      assert.strictEqual(result[0].minorVi,  undefined, 'minor should be skipped');
    });
  });

  it('passes correct query parameters to Translation.findAll', async function () {
    const records = [
      mockRecord({ major: 'A', middle: 'B' }),
      mockRecord({ major: 'A', middle: 'C' }),
    ];
    let capturedArgs = null;
    mockModels.Translation.findAll = async (args) => {
      capturedArgs = args;
      return [];
    };
    try {
      await enrichBilingual('AccountClass', records, { primary: 'ja', secondary: 'vi' });
      assert.ok(capturedArgs, 'findAll should have been called');
      assert.strictEqual(capturedArgs.where.tableName, 'AccountClass');
      assert.strictEqual(capturedArgs.where.language, 'vi');
      assert.strictEqual(capturedArgs.where.tenantId, null);
      // AccountClass maps all 3 fields (major, middle, minor) regardless of record shape
      assert.deepStrictEqual(capturedArgs.where.field, ['major', 'middle', 'minor']);
      // Set dedup: 'major:A' appears twice in records but only once in query
      assert.ok(
        capturedArgs.where.recordKey.filter(k => k === 'major:A').length === 1,
        'recordKey should be deduplicated'
      );
    } finally {
      mockModels.Translation.findAll = async () => [];
    }
  });

  it('does not mutate record values beyond adding secondary fields', async function () {
    const records = [mockRecord({ major: 'A', middle: 'B', minor: 'C' })];
    await withTranslations(ACCOUNT_CLASS_TRANSLATIONS, async () => {
      await enrichBilingual('AccountClass', records, { primary: 'ja', secondary: 'vi' });
      assert.strictEqual(records[0].major, 'A', 'original major unchanged');
      assert.strictEqual(records[0].middle, 'B', 'original middle unchanged');
      assert.strictEqual(records[0].minor, 'C', 'original minor unchanged');
    });
  });
});

// ---------------------------------------------------------------------------
// secondaryFieldSuffix / getEnrichedName / shapeAccountBilingual
// ---------------------------------------------------------------------------

describe('secondaryFieldSuffix', function () {

  it('capitalizes language code', function () {
    assert.strictEqual(secondaryFieldSuffix('vi'), 'Vi');
    assert.strictEqual(secondaryFieldSuffix('en'), 'En');
  });

  it('returns empty string for falsy input', function () {
    assert.strictEqual(secondaryFieldSuffix(undefined), '');
    assert.strictEqual(secondaryFieldSuffix(''), '');
  });
});

describe('getEnrichedName', function () {

  it('reads nameVi when secondary is vi', function () {
    const rec = mockRecord({ name: '預り金', nameVi: 'Tiền giữ hộ' });
    assert.strictEqual(getEnrichedName(rec, { primary: 'ja', secondary: 'vi' }), 'Tiền giữ hộ');
  });

  it('reads nameEn when secondary is en', function () {
    const rec = mockRecord({ name: '預り金', nameEn: 'Deposits received' });
    assert.strictEqual(getEnrichedName(rec, { primary: 'ja', secondary: 'en' }), 'Deposits received');
  });

  it('returns empty string when no enriched field exists', function () {
    const rec = mockRecord({ name: '預り金' });
    assert.strictEqual(getEnrichedName(rec, { primary: 'ja', secondary: 'vi' }), '');
  });
});

describe('shapeAccountBilingual', function () {

  function mockAccountInstance(props, subAccounts = []) {
    const data = { ...props, subAccounts };
    return new Proxy(data, {
      get(target, prop) {
        if (prop === 'setDataValue') return (key, value) => { target[key] = value; };
        if (prop === 'toJSON') return () => {
          const { subAccounts: subs, ...rest } = target;
          return { ...rest };
        };
        if (prop === 'getDataValue') return (key) => target[key];
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      has(target, prop) { return prop in target; },
      ownKeys(target) { return Reflect.ownKeys(target); },
      getOwnPropertyDescriptor(target, prop) {
        return Object.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  function mockSubInstance(props) {
    return mockRecord(props);
  }

  it('maps account and sub-account enriched names to nameVi', function () {
    const subs = [
      mockSubInstance({ id: 1, name: '源泉所得税', nameVi: 'Thuế TNCN khấu trừ tại nguồn', subAccountCode: 1 }),
      mockSubInstance({ id: 2, name: '住民税', nameVi: 'Thuế cư trú', subAccountCode: 2 }),
    ];
    const account = mockAccountInstance(
      { id: 10, name: '預り金', nameVi: 'Tiền giữ hộ', accountCode: '2010000' },
      subs
    );

    const shaped = shapeAccountBilingual(account, { primary: 'ja', secondary: 'vi' });

    assert.strictEqual(shaped.name, '預り金');
    assert.strictEqual(shaped.nameVi, 'Tiền giữ hộ');
    assert.strictEqual(shaped.subAccounts.length, 2);
    assert.strictEqual(shaped.subAccounts[0].nameVi, 'Thuế TNCN khấu trừ tại nguồn');
    assert.strictEqual(shaped.subAccounts[1].nameVi, 'Thuế cư trú');
  });

  it('returns empty nameVi when languagePair has no secondary', function () {
    const account = mockAccountInstance({ name: '預り金', accountCode: '2010000' }, []);
    const shaped = shapeAccountBilingual(account, { primary: 'ja' });
    assert.strictEqual(shaped.nameVi, '');
  });
});
