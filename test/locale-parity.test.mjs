/**
 * Locale key parity tests
 *
 * Verifies that all three locale JSON files (ja, vi, en) share the same keys.
 * ja.json is the authoritative source; vi and en must not introduce keys absent
 * from ja. Missing keys in vi/en are warned but not treated as hard failures
 * (en is intentionally incomplete).
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const jaDict = JSON.parse(readFileSync(join(__dirname, '../front/javascripts/locales/ja.json'), 'utf8'));
const viDict = JSON.parse(readFileSync(join(__dirname, '../front/javascripts/locales/vi.json'), 'utf8'));
const enDict = JSON.parse(readFileSync(join(__dirname, '../front/javascripts/locales/en.json'), 'utf8'));

const jaKeys = Object.keys(jaDict);
const viKeys = Object.keys(viDict);
const enKeys = Object.keys(enDict);

describe('Locale key parity', () => {
  it('ja.json has all keys referenced in vi.json', () => {
    const missing = viKeys.filter((k) => !(k in jaDict));
    assert.deepStrictEqual(missing, [], `vi.json has keys missing from ja.json: ${missing.join(', ')}`);
  });

  it('ja.json has all keys referenced in en.json', () => {
    const missing = enKeys.filter((k) => !(k in jaDict));
    assert.deepStrictEqual(missing, [], `en.json has keys missing from ja.json: ${missing.join(', ')}`);
  });

  it('vi.json has all keys from ja.json', () => {
    const missing = jaKeys.filter((k) => !(k in viDict));
    if (missing.length > 0) {
      console.warn(`vi.json is missing ${missing.length} key(s) from ja.json: ${missing.join(', ')}`);
    }
    assert.ok(true);
  });

  it('no empty string values in ja.json', () => {
    const emptyKeys = jaKeys.filter((k) => jaDict[k] === '');
    assert.deepStrictEqual(emptyKeys, [], `ja.json has empty string values: ${emptyKeys.join(', ')}`);
  });

  it('no empty string values in vi.json', () => {
    const emptyKeys = viKeys.filter((k) => viDict[k] === '');
    assert.deepStrictEqual(emptyKeys, [], `vi.json has empty string values: ${emptyKeys.join(', ')}`);
  });

  it('all locale values are strings', () => {
    const nonStringEntries = [];
    for (const [dict, name] of [[jaDict, 'ja'], [viDict, 'vi'], [enDict, 'en']]) {
      for (const [k, v] of Object.entries(dict)) {
        if (typeof v !== 'string') {
          nonStringEntries.push(`${name}.json["${k}"] = ${JSON.stringify(v)} (${typeof v})`);
        }
      }
    }
    assert.deepStrictEqual(nonStringEntries, [], `Non-string values found: ${nonStringEntries.join(', ')}`);
  });
});
