/**
 * Hierarchy view helpers — Issue #210 (E1.4).
 *
 * Pure functions that take the flat lines emitted by the v2 contract
 * (optionally with subtotals already inserted via libs/reporting/tb-subtotal)
 * and reshape them for the 5-level 試算表 view (大/中/小/勘定/補助科目).
 *
 *   - withAccountParents(lines)
 *       Insert a synthetic `type:'parent'` row above each cluster of
 *       subAccount lines that share the same account code, so the UI
 *       can render a 勘定 (account) header with a [+/-] toggle. The
 *       parent row's name / code / class fields come from the first
 *       sub's v2 mapping (the engine returns the account name in
 *       `name`/`nameVi` even on subAccount lines, see trial-balance-v2).
 *
 *   - applyExpandCollapse(lines, expanded)
 *       Hide subAccount rows whose parent code is not in `expanded`.
 *       Parent / account / subtotal rows are always visible.
 *
 *   - indentClass(line)
 *       Returns a CSS class key for the line's level:
 *         major subtotal      → 'tb-indent-0'
 *         middle subtotal     → 'tb-indent-1'
 *         minor subtotal      → 'tb-indent-2'
 *         parent (勘定)       → 'tb-indent-3'
 *         standalone account  → 'tb-indent-3'
 *         subAccount (補助)   → 'tb-indent-4'
 */

function nextSubAccountCode(lines, i) {
  // Helper: find the next subAccount's parent code from index i+1, scanning
  // forward until we find a subAccount or a different "kind" boundary.
  for (let j = i + 1; j < lines.length; j += 1) {
    const x = lines[j];
    if (x.type === 'subAccount') return x.code;
    if (x.type === 'account' || x.type === 'subtotal' || x.type === 'parent') return null;
  }
  return null;
}

export function withAccountParents(lines) {
  if (!Array.isArray(lines)) return [];
  const out = [];
  let lastSubCode = null;
  for (const l of lines) {
    if (l.type === 'subAccount') {
      if (lastSubCode !== l.code) {
        // Insert a synthetic parent row above the first sub of this account.
        out.push({
          type: 'parent',
          isParent: true,
          code: l.code,
          accountId: l.accountId,
          accountClassId: l.accountClassId,
          aclCode: l.aclCode,
          major: l.major,
          middle: l.middle,
          minor: l.minor,
          majorVi: l.majorVi,
          middleVi: l.middleVi,
          minorVi: l.minorVi,
          name: l.name,
          nameVi: l.nameVi,
          warningCodes: [],
        });
        lastSubCode = l.code;
      }
      out.push(l);
    } else {
      // Any non-sub line breaks the cluster. The next sub we see starts a
      // fresh account group (if it differs from the one we just emitted).
      if (l.type === 'account' || l.type === 'subtotal' || l.type === 'parent') {
        lastSubCode = null;
      }
      out.push(l);
    }
  }
  return out;
}

export function applyExpandCollapse(lines, expanded) {
  if (!Array.isArray(lines)) return [];
  if (!(expanded instanceof Set)) expanded = new Set();
  return lines.filter((l) => {
    if (l.type === 'subAccount') {
      // Hide sub rows whose parent is collapsed. A sub without a code is
      // an orphan — never show.
      if (l.code == null) return false;
      return expanded.has(l.code);
    }
    return true;
  });
}

export function indentClass(line) {
  if (!line) return 'tb-indent-0';
  if (line.type === 'subtotal') {
    if (line.level === 'major') return 'tb-indent-0';
    if (line.level === 'middle') return 'tb-indent-1';
    return 'tb-indent-2'; // minor
  }
  if (line.type === 'parent') return 'tb-indent-3';
  if (line.type === 'account') return 'tb-indent-3';
  if (line.type === 'subAccount') return 'tb-indent-4';
  return 'tb-indent-0';
}

export { nextSubAccountCode };
