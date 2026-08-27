/**
 * Warning rules — Issue #212 (E1.6).
 *
 * Three rules per initiative.md §Warnings:
 *
 *   TB-W001 critical — Σ movementDebit ≠ Σ movementCredit cho period.
 *                     Top banner. Phase 1: does NOT block export.
 *   TB-W002 high     — Có CrossSlip trong term hiện tại có approvedAt IS NULL.
 *                     Banner + link tới danh sách unapproved.
 *   TB-W005 medium   — 現金 / 普通預金 (cash/bank per config) có endingDebit
 *                     < 0. Highlight row đỏ.
 *
 * Phase 1: rules are hard-coded; severity + title bilingual.
 * Phase 2: expose config (lib/reporting/warning-rules-config.js) so each
 * tenant can override which codes count as cash/bank.
 *
 * API:
 *   const { messages } = await runWarningRules({ lines, meta, deps });
 *   // → messages: [{ code, severity, title, titleVi, lineCode?, lineSubCode?, detail? }]
 *   // Banner messages have NO lineCode/lineSubCode. Line messages do.
 *
 *   const { banners, byLineKey } = splitBannerAndLine(messages);
 *   const linesWithCodes = applyLineWarningCodes(lines, byLineKey);
 */

// Phase 1 cash/bank config: account code prefixes (first 3 chars of 7-digit code).
const CASH_BANK_PREFIXES = ['100', '101']; // 現金 (1000000) + 普通預金 (1010000)

const isCashOrBank = (line) => {
  if (!line || !line.code) return false;
  return CASH_BANK_PREFIXES.some((p) => String(line.code).startsWith(p));
};

const warningRules = [
  {
    id: 'TB-W001',
    severity: 'critical',
    title: '借方合計 ≠ 貸方合計',
    titleVi: 'Tổng Nợ ≠ Tổng Có',
    evaluate: ({ meta }) => {
      const t = meta.totals;
      if (!t) return [];
      if (t.movementDebit === t.movementCredit) return [];
      return [{
        detail: {
          movementDebit: t.movementDebit,
          movementCredit: t.movementCredit,
          diff: t.movementDebit - t.movementCredit,
        },
      }];
    },
  },
  {
    id: 'TB-W002',
    severity: 'high',
    title: '未承認の伝票があります',
    titleVi: 'Có chứng từ chưa duyệt',
    evaluate: async ({ meta, deps }) => {
      if (!deps || !deps.CrossSlip) return [];
      const count = await deps.CrossSlip.count({
        where: {
          tenantId: meta.tenantId,
          term: meta.term,
          approvedAt: null,
        },
      });
      if (count === 0) return [];
      return [{ detail: { count } }];
    },
  },
  {
    id: 'TB-W005',
    severity: 'medium',
    title: '現金/預金の残高がマイナス',
    titleVi: 'Số dư tiền mặt / ngân hàng âm',
    evaluate: ({ lines }) => {
      const out = [];
      for (const l of lines) {
        if (!isCashOrBank(l)) continue;
        // For D-nature (cash/bank are field=1, D): balance = endingDebit - endingCredit.
        // Negative when endingCredit > endingDebit, i.e. (endingDebit - endingCredit) < 0.
        const bal = (l.endingDebit || 0) - (l.endingCredit || 0);
        if (bal < 0) {
          out.push({
            lineCode: l.code,
            lineSubCode: l.subCode != null ? l.subCode : null,
            detail: { balance: l.balance, endingDebit: l.endingDebit, endingCredit: l.endingCredit },
          });
        }
      }
      return out;
    },
  },
];

export async function runWarningRules({ lines, meta, deps }) {
  const out = [];
  for (const rule of warningRules) {
    let msgs = [];
    try {
      msgs = await rule.evaluate({ lines, meta, deps });
    } catch (e) {
      // Don't fail the whole pipeline on a single rule error; report as banner.
      out.push({
        code: rule.id,
        severity: rule.severity,
        title: rule.title,
        titleVi: rule.titleVi,
        detail: { error: e?.message || 'rule failed' },
      });
      continue;
    }
    for (const m of msgs || []) {
      out.push({
        code: rule.id,
        severity: rule.severity,
        title: rule.title,
        titleVi: rule.titleVi,
        ...m,
      });
    }
  }
  return out;
}

export function splitBannerAndLine(messages) {
  const banners = [];
  const byLineKey = new Map();
  for (const m of messages) {
    if (m.lineCode != null) {
      const k = `${m.lineCode}|${m.lineSubCode != null ? m.lineSubCode : ''}`;
      if (!byLineKey.has(k)) byLineKey.set(k, []);
      byLineKey.get(k).push(m.code);
    } else {
      banners.push(m);
    }
  }
  return { banners, byLineKey };
}

export function applyLineWarningCodes(lines, byLineKey) {
  return lines.map((l) => {
    const k = `${l.code || ''}|${l.subCode != null ? l.subCode : ''}`;
    const codes = byLineKey.get(k);
    if (!codes) return l;
    return { ...l, warningCodes: [...(l.warningCodes || []), ...codes] };
  });
}

export { warningRules, CASH_BANK_PREFIXES, isCashOrBank };
