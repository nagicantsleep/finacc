/**
 * Excel export — Issue #213 (E1.7).
 *
 * Server-side export for trial balance v2 response. Produces a 2-sheet
 * workbook:
 *   - Sheet `試算表_<reportType>`: tenant header (rows 1-3), column
 *     headers (row 4), data (rows 5+; subtotals + accounts + subAccounts
 *     in the order provided), totals (last row).
 *   - Sheet `Warnings`: one row per warning (if any).
 *
 *   Number format: `#,##0;[Red]-#,##0` (per BRD 10.11).
 *   File name:    `trial_balance_{tenantCode}_{term}_{YYYYMMDDHHmm}.xlsx`.
 *
 *   The function is pure wrt the v2 contract: it consumes the JSON shape
 *   produced by `trialBalanceV2` (with buildSubtotals already applied to
 *   lines if the caller wants subtotal rows). It does NOT touch the DB.
 */
import ExcelJS from 'exceljs';

const NUM_FMT = '#,##0;[Red]-#,##0';

const COLS = [
  { key: 'code', header: '科目 / Mã', width: 14 },
  { key: 'name', header: '科目名 / Tên', width: 32 },
  { key: 'openingDebit',  header: '期首借方 / Dư đầu kỳ - Nợ',   width: 16, num: true },
  { key: 'openingCredit', header: '期首貸方 / Dư đầu kỳ - Có',   width: 16, num: true },
  { key: 'movementDebit', header: '期間借方 / Phát sinh - Nợ',   width: 16, num: true },
  { key: 'movementCredit',header: '期間貸方 / Phát sinh - Có',   width: 16, num: true },
  { key: 'endingDebit',   header: '期末借方 / Dư cuối kỳ - Nợ', width: 16, num: true },
  { key: 'endingCredit',  header: '期末貸方 / Dư cuối kỳ - Có', width: 16, num: true },
  { key: 'balance',       header: '残高 / Số dư',                 width: 16, num: true },
];

const formatDate = (d) => {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Build the workbook in memory. Returns the ExcelJS.Workbook so callers
 * can stream it as a buffer via `workbook.xlsx.writeBuffer()`.
 *
 * @param {object} v2   The full v2 response (with .meta + .lines).
 *                      .lines may include subtotal rows (from buildSubtotals).
 * @param {object} [opts]
 * @param {string} [opts.tenantCode='UNKNOWN']  used in the file name and header
 * @param {string} [opts.sheetName]             override the default sheet name
 */
export function buildWorkbook(v2, opts = {}) {
  if (!v2 || !v2.meta) throw new Error('buildWorkbook: v2.meta is required');
  const { tenantCode = 'UNKNOWN' } = opts;
  const meta = v2.meta;
  const lines = v2.lines || [];
  const warnings = meta.warnings || [];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'kaikei';
  wb.created = new Date();
  wb.modified = new Date();

  const sheetName = opts.sheetName || `試算表_${meta.reportType || 'balance'}`;
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'normal', showGridLines: false }],
  });

  // Column widths.
  ws.columns = COLS.map((c) => ({ width: c.width }));

  // ---- Header rows (1-3) ----
  const r1 = ws.getRow(1);
  r1.getCell(1).value = `Tenant: ${tenantCode}  /  Term: ${meta.term}`;
  r1.getCell(7).value = `Period: ${meta.period?.label || 'full'}  (${formatDate(meta.period?.from)} 〜 ${formatDate(meta.period?.to)})`;
  r1.font = { bold: true };
  r1.commit();

  const r2 = ws.getRow(2);
  r2.getCell(1).value = `Report: ${meta.reportType}`;
  r2.getCell(3).value = `Language: ${meta.languageMode || 'ja'}`;
  r2.getCell(7).value = `Generated: ${formatDate(meta.generatedAt)} ${pad2(new Date(meta.generatedAt).getHours())}:${pad2(new Date(meta.generatedAt).getMinutes())}`;
  r2.commit();

  const r3 = ws.getRow(3);
  r3.getCell(1).value = `W001 critical does NOT block export (phase 1 per initiative §1.6)`;
  r3.font = { italic: true, color: { argb: 'FF888888' } };
  r3.commit();

  // ---- Column headers (row 4) ----
  const header = ws.getRow(4);
  COLS.forEach((c, i) => { header.getCell(i + 1).value = c.header; });
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  header.commit();

  // ---- Data rows (5+) ----
  let rowIdx = 5;
  for (const l of lines) {
    const row = ws.getRow(rowIdx);
    const isSub = l.type === 'subtotal';
    const isParent = l.type === 'parent';
    const isSubAcc = l.type === 'subAccount';
    const codeCell = isSub
      ? `【${l.level}】`
      : isParent
        ? l.code
        : isSubAcc
          ? `${l.code}-${l.subCode}`
          : (l.code || '');
    const nameCell = isSub
      ? (l.name || '')
      : isParent
        ? (l.name || '')
        : isSubAcc
          ? `  └ ${l.subName || ''}`
          : (l.name || '');
    row.getCell(1).value = codeCell;
    row.getCell(2).value = nameCell;
    row.getCell(3).value = l.openingDebit || 0;
    row.getCell(4).value = l.openingCredit || 0;
    row.getCell(5).value = l.movementDebit || 0;
    row.getCell(6).value = l.movementCredit || 0;
    row.getCell(7).value = l.endingDebit || 0;
    row.getCell(8).value = l.endingCredit || 0;
    row.getCell(9).value = l.balance || 0;
    for (let c = 3; c <= 9; c += 1) {
      row.getCell(c).numFmt = NUM_FMT;
      row.getCell(c).alignment = { horizontal: 'right' };
    }
    if (isSub || isParent) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
    }
    if ((l.warningCodes || []).some((c) => c === 'TB-W005')) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE7E7' } };
    }
    rowIdx += 1;
  }

  // ---- Totals row ----
  const totals = meta.totals || {};
  const tr = ws.getRow(rowIdx);
  tr.getCell(1).value = 'TOTAL';
  tr.getCell(2).value = '';
  tr.getCell(3).value = totals.openingDebit || 0;
  tr.getCell(4).value = totals.openingCredit || 0;
  tr.getCell(5).value = totals.movementDebit || 0;
  tr.getCell(6).value = totals.movementCredit || 0;
  tr.getCell(7).value = totals.endingDebit || 0;
  tr.getCell(8).value = totals.endingCredit || 0;
  tr.getCell(9).value = (totals.endingDebit || 0) - (totals.endingCredit || 0);
  for (let c = 3; c <= 9; c += 1) {
    tr.getCell(c).numFmt = NUM_FMT;
    tr.getCell(c).alignment = { horizontal: 'right' };
  }
  tr.font = { bold: true };
  tr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

  // ---- Warnings sheet ----
  if (warnings.length > 0) {
    const wsW = wb.addWorksheet('Warnings');
    wsW.columns = [
      { header: 'Code', width: 10 },
      { header: 'Severity', width: 10 },
      { header: 'Title (ja)', width: 32 },
      { header: 'Title (vi)', width: 32 },
      { header: 'Detail', width: 48 },
    ];
    wsW.getRow(1).font = { bold: true };
    wsW.getRow(1).values = ['Code', 'Severity', 'Title (ja)', 'Title (vi)', 'Detail'];
    let wRow = 2;
    for (const w of warnings) {
      wsW.getRow(wRow).values = [w.code, w.severity, w.title || '', w.titleVi || '', JSON.stringify(w.detail || {})];
      wRow += 1;
    }
  }

  return wb;
}

/**
 * Convenience: build the workbook AND return the xlsx Buffer.
 */
export async function buildXlsxBuffer(v2, opts) {
  const wb = buildWorkbook(v2, opts);
  return wb.xlsx.writeBuffer();
}

/**
 * File name: `trial_balance_{tenantCode}_{term}_{YYYYMMDDHHmm}.xlsx`.
 */
export function fileNameFor({ tenantCode = 'UNKNOWN', term, when = new Date() }) {
  const y = when.getFullYear();
  const mo = pad2(when.getMonth() + 1);
  const d = pad2(when.getDate());
  const h = pad2(when.getHours());
  const mi = pad2(when.getMinutes());
  return `trial_balance_${tenantCode}_${term}_${y}${mo}${d}${h}${mi}.xlsx`;
}

export { COLS, NUM_FMT };
