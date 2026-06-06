import { writable, derived, get } from 'svelte/store';

/**
 * Bilingual display engine.
 *
 * Stores:
 *   languagePair — { primary: 'ja', secondary: 'vi' }
 *   dictionaries — { ja: {...}, vi: {...}, en: {...} }
 *
 * Usage:
 *   import { languagePair, _b } from '../javascripts/bilingual.js';
 *   const labels = _b('save');
 *   // => { primary: '保存', secondary: 'Lưu' }
 *
 *   // Or use the derived store directly in template:
 *   $: labels = $_b('save');
 */

// --- Language pair store ------------------------------------------------

/** @type {import('svelte/store').Writable<{primary: string, secondary: string}>} */
export const languagePair = writable({ primary: 'ja', secondary: 'vi' });

// --- Dictionary loading --------------------------------------------------

const dictionaries = {};

/**
 * Load locale dictionaries. Called once on app init.
 * In dev, imports the JSON files directly. SSR-side can pass fetched data.
 *
 * @param {Record<string, object>} localeData - { ja: {...}, vi: {...}, en: {...} }
 */
export function loadDictionaries(localeData) {
  for (const [lang, data] of Object.entries(localeData)) {
    dictionaries[lang] = data;
  }
}

// --- Helper for component <script> blocks -------------------------------

/**
 * Resolve a translation key to a { primary, secondary } pair
 * for the currently active language pair.
 *
 * Call this once per key in <script> and use the result in template,
 * OR use the $_b(key) reactive statement with $languagePair.
 *
 * @param {string} key
 * @returns {{ primary: string, secondary: string }}
 */
export function _b(key) {
  const pair = get(languagePair);
  const primaryDict = dictionaries[pair.primary] || {};
  const secondaryDict = dictionaries[pair.secondary] || {};
  return {
    primary: primaryDict[key] ?? key,
    secondary: secondaryDict[key] ?? key
  };
}

// --- Derived store for reactive templates -------------------------------

/**
 * Reactive derived store: recomputes when languagePair changes.
 * Usage in template:  $: t = $_b('save');
 */
export const _bDerived = derived(languagePair, ($pair) => {
  const primaryDict = dictionaries[$pair.primary] || {};
  const secondaryDict = dictionaries[$pair.secondary] || {};
  return (key) => ({
    primary: primaryDict[key] ?? key,
    secondary: secondaryDict[key] ?? key
  });
});

/**
 * Reactive derived: returns a flat bilingual string "primary / secondary".
 * Use in reactive statements: $: title = $bi('save');
 */
export const bi = derived(languagePair, ($pair) => {
  return (key) => {
    const primaryDict = dictionaries[$pair.primary] || {};
    const secondaryDict = dictionaries[$pair.secondary] || {};
    const p = primaryDict[key] ?? key;
    const s = secondaryDict[key] ?? key;
    return p === s ? p : `${p} / ${s}`;
  };
});

export default { languagePair, _b, _bDerived, bi, loadDictionaries };
