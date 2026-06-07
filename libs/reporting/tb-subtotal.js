/**
 * Subtotal builder — Issue #208 (E1.2).
 *
 * Consumer-side helper: takes the flat lines emitted by the v2 contract
 * (see libs/reporting/trial-balance-v2.js) and inserts `type:'subtotal'`
 * rows at three levels — major, middle, minor — so the UI and the export
 * can render a hierarchical 試算表 without each one re-implementing the
 * tree walk.
 *
 * Aggregation rules (per initiative.md §Subtotal & hierarchy):
 *   - Subtotal = Σ dòng con (only `type:'account'` and `type:'subAccount'`).
 *   - openingDebit/Credit, movementDebit/Credit, endingDebit/Credit are
 *     summed per side (not netted), preserving Japanese accounting where
 *     a D-side balance stays on D-side and a C-side balance stays on C-side.
 *   - `balance` is the sum of children's signed balances; the UI uses it
 *     for net display, not for dc-splitting.
 *
 * Emission order: for each major, walk middles in first-seen order; for
 * each middle, walk minors in first-seen order; emit each minor's data
 * lines, then a minor subtotal, then a middle subtotal, then a major
 * subtotal. Lines that aren't data (e.g. `type:'subtotal'` from a prior
 * pass, or account rows missing major/middle/minor) are passed through
 * unchanged at the end.
 */

function sumLines(lines) {
  let openingDebit = 0, openingCredit = 0;
  let movementDebit = 0, movementCredit = 0;
  let endingDebit = 0, endingCredit = 0;
  let balance = 0;
  for (const l of lines) {
    openingDebit += l.openingDebit || 0;
    openingCredit += l.openingCredit || 0;
    movementDebit += l.movementDebit || 0;
    movementCredit += l.movementCredit || 0;
    endingDebit += l.endingDebit || 0;
    endingCredit += l.endingCredit || 0;
    balance += l.balance || 0;
  }
  return { openingDebit, openingCredit, movementDebit, movementCredit, endingDebit, endingCredit, balance };
}

function makeSubtotalRow(meta, sums, level) {
  return {
    type: 'subtotal',
    level,
    accountClassId: null, aclCode: null,
    accountId: null, code: null,
    subAccountId: null, subCode: null, subName: null, subNameVi: null,
    major: meta.major || null,
    middle: meta.middle || null,
    minor: meta.minor || null,
    majorVi: meta.majorVi || null,
    middleVi: meta.middleVi || null,
    minorVi: meta.minorVi || null,
    name: level === 'major' ? meta.major : level === 'middle' ? meta.middle : meta.minor,
    nameVi: level === 'major' ? meta.majorVi : level === 'middle' ? meta.middleVi : meta.minorVi,
    openingDebit: sums.openingDebit,
    openingCredit: sums.openingCredit,
    movementDebit: sums.movementDebit,
    movementCredit: sums.movementCredit,
    endingDebit: sums.endingDebit,
    endingCredit: sums.endingCredit,
    balance: sums.balance,
    warningCodes: [],
    isSubtotal: true,
  };
}

/**
 * Insert subtotal rows. Pure function; no I/O.
 *
 * @param {Array<object>} lines  Flat v2 lines (account / subAccount).
 * @returns {Array<object>}      Lines with `type:'subtotal'` rows interleaved.
 */
export function buildSubtotals(lines) {
  if (!Array.isArray(lines)) return [];
  const tree = new Map();
  const passthrough = [];

  for (const l of lines) {
    if (l.type !== 'account' && l.type !== 'subAccount') {
      passthrough.push(l);
      continue;
    }
    const { major, middle, minor } = l;
    if (!major || !middle || !minor) {
      passthrough.push(l);
      continue;
    }
    if (!tree.has(major)) {
      tree.set(major, {
        meta: { major, majorVi: l.majorVi || null },
        middles: new Map(),
      });
    }
    const majorNode = tree.get(major);
    if (!majorNode.middles.has(middle)) {
      majorNode.middles.set(middle, {
        meta: { middle, middleVi: l.middleVi || null },
        minors: new Map(),
      });
    }
    const middleNode = majorNode.middles.get(middle);
    if (!middleNode.minors.has(minor)) {
      middleNode.minors.set(minor, {
        meta: { minor, minorVi: l.minorVi || null },
        lines: [],
      });
    }
    const minorNode = middleNode.minors.get(minor);
    minorNode.lines.push(l);
  }

  const out = [];
  for (const [, majorNode] of tree) {
    for (const [, middleNode] of majorNode.middles) {
      for (const [, minorNode] of middleNode.minors) {
        for (const l of minorNode.lines) out.push(l);
        out.push(makeSubtotalRow(
          { ...minorNode.meta, major: majorNode.meta.major, majorVi: majorNode.meta.majorVi },
          sumLines(minorNode.lines),
          'minor'
        ));
      }
      const middleLines = [];
      for (const n of middleNode.minors.values()) for (const l of n.lines) middleLines.push(l);
      out.push(makeSubtotalRow(
        { ...middleNode.meta, major: majorNode.meta.major, majorVi: majorNode.meta.majorVi },
        sumLines(middleLines),
        'middle'
      ));
    }
    const majorLines = [];
    for (const m of majorNode.middles.values()) {
      for (const n of m.minors.values()) for (const l of n.lines) majorLines.push(l);
    }
    out.push(makeSubtotalRow(
      { ...majorNode.meta, middle: null, middleVi: null, minor: null, minorVi: null },
      sumLines(majorLines),
      'major'
    ));
  }
  return [...out, ...passthrough];
}

// Flatten the lines of a middle / major node for summing. Avoids storing
// lines[] at every level (we only need the rolled-up totals).
function middleFlatLines(middleNode) {
  const out = [];
  for (const n of middleNode.minors.values()) {
    for (const l of n.lines) out.push(l);
  }
  return out;
}

function majorFlatLines(majorNode) {
  const out = [];
  for (const m of majorNode.middles.values()) {
    for (const n of m.minors.values()) {
      for (const l of n.lines) out.push(l);
    }
  }
  return out;
}

export { sumLines, makeSubtotalRow };
