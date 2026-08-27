/**
 * Bilingual display helpers — Issue #215 (E1.9).
 *
 * Pure functions for choosing which name to render for a v2 line, given
 * a `languageMode` (ja / vi / ja-vi / vi-ja). Implements the fallback rule
 * from initiative.md §Bilingual display:
 *
 *   - thiếu nameVi → dùng name
 *   - thiếu name   → dùng code
 *
 * Returns `{ primary, secondary }` where either field may be null (caller
 * decides stacked vs inline).
 *
 * `languagePairForMode(mode)` returns the languagePair dict that should
 * be sent on the API request so the response carries both ja + vi fields.
 */
export const LANG_MODES = ['ja', 'vi', 'ja-vi', 'vi-ja'];

const pickFallback = (ja, vi, code) => {
  if (ja != null && ja !== '') return ja;
  if (vi != null && vi !== '') return vi;
  return code != null ? String(code) : '';
};

export function pickDisplayName(line, mode) {
  if (!line) return { primary: '', secondary: null };
  const ja = line.name;
  const vi = line.nameVi;
  const code = line.code;
  switch (mode) {
    case 'vi':
      return { primary: vi || ja || code || '', secondary: null };
    case 'ja-vi':
      return { primary: ja || code || '', secondary: vi || null };
    case 'vi-ja':
      return { primary: vi || ja || code || '', secondary: ja || null };
    case 'ja':
    default:
      return { primary: ja || code || '', secondary: null };
  }
}

/**
 * Map a display mode to the languagePair query value sent to the API.
 *  - ja      → no pair (default JA, no VI)
 *  - vi      → { vi: 'ja' } so the response carries both ja + vi fields
 *  - ja-vi   → { ja: 'vi' }
 *  - vi-ja   → { vi: 'ja' }
 */
export function languagePairForMode(mode) {
  switch (mode) {
    case 'vi':    return { vi: 'ja' };
    case 'ja-vi': return { ja: 'vi' };
    case 'vi-ja': return { vi: 'ja' };
    case 'ja':
    default:      return null;
  }
}

/**
 * Convenience: stringify a languagePair for the ?languagePair=... query
 * parameter. Returns null if there's no pair to send.
 */
export function languagePairQuery(mode) {
  const pair = languagePairForMode(mode);
  return pair ? JSON.stringify(pair) : null;
}

export { pickFallback };
