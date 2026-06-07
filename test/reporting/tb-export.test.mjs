/**
 * Unit tests — Issue #213 (E1.7): libs/reporting/tb-export.js
 *
 * Run with: npx mocha test/reporting/tb-export.test.mjs
 */

import { strict as assert } from 'node:assert';
import {
  buildWorkbook,
  buildXlsxBuffer,
  fileNameFor,
  COLS,
  NUM_FMT,
} from '../../libs/reporting/tb-export.js';

const v2 = (over = {}) => ({
  version: 2,
  meta: {
    tenantId: 1,
    term: 1,
    reportType: 'balance',
    period: { from: new Date('2026-01-01'), to: new Date('2026-12-31'), label: 'full' },
    fiscalYear: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
    languageMode: 'ja',
    generatedAt: new Date('2026-06-07T12:00:00'),
    warnings: [],
    totals: {
      openingDebit: 100, openingCredit: 0,
      movementDebit: 230, movementCredit: 200,
      endingDebit: 130, endingCredit: 0,
    },
    filters: { accountClassIds: [], hideZero: false, includeUnapproved: false, month: null },
    ...(over.meta || {}),
  },
  lines: over.lines || [
    { type: 'subtotal', level: 'major', name: '資産', balance: 100, openingDebit: 100, endingDebit: 100, warningCodes: [] },
    { type: 'account', code: '1000000', name: '現金', openingDebit: 100, movementDebit: 230, movementCredit: 200, endingDebit: 130, balance: 130, warningCodes: [] },
  ],
});

// ---------------------------------------------------------------------------
// buildWorkbook
// ---------------------------------------------------------------------------

describe('buildWorkbook', () => {
  it('throws when meta is missing', () => {
    assert.throws(() => buildWorkbook({}), /meta is required/);
  });

  it('returns an ExcelJS.Workbook with the data sheet', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const sheets = wb.worksheets.map((w) => w.name);
    assert.ok(sheets.includes('試算表_balance'), `sheets: ${sheets.join(', ')}`);
  });

  it('data sheet has 4 header rows then 1 subtotal + 1 account + 1 totals', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    // 4 header rows + 2 data rows + 1 totals row = 7
    assert.equal(ws.rowCount, 7, `rowCount = ${ws.rowCount}`);
  });

  it('data sheet column headers in row 4', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    const r = ws.getRow(4);
    assert.equal(r.getCell(1).value, COLS[0].header);
    assert.equal(r.getCell(2).value, COLS[1].header);
    assert.equal(r.getCell(9).value, COLS[8].header);
    assert.equal(r.font.bold, true);
  });

  it('data rows have number format on numeric columns', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    const r = ws.getRow(5); // first data row (subtotal)
    for (let c = 3; c <= 9; c += 1) {
      assert.equal(r.getCell(c).numFmt, NUM_FMT);
    }
  });

  it('subtotal row has bold + grey fill', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    const r = ws.getRow(5);
    assert.equal(r.font.bold, true);
    assert.ok(r.fill && r.fill.fgColor);
  });

  it('account row not bold by default', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    const r = ws.getRow(6);
    assert.ok(!r.font || r.font.bold !== true, 'account row should not be bold');
  });

  it('account code + name written into columns 1 + 2', () => {
    const wb = buildWorkbook(v2(), { tenantCode: 'T1' });
    const ws = wb.worksheets[0];
    const r = ws.getRow(6);
    assert.equal(r.getCell(1).value, '1000000');
    assert.equal(r.getCell(2).value, '現金');
  });

  it('subAccount row formats code as `${code}-${subCode}`', () => {
    const data = v2({ lines: [
      { type: 'subAccount', code: '3050000', subCode: 2, subName: 'A社', balance: 50, warningCodes: [] },
    ] });
    const wb = buildWorkbook(data);
    const ws = wb.worksheets[0];
    // row 5 = sub account data
    const r = ws.getRow(5);
    assert.equal(r.getCell(1).value, '3050000-2');
    assert.match(r.getCell(2).value, /A社/);
  });

  it('parent row: code in col 1, name in col 2 (no subCode)', () => {
    const data = v2({ lines: [
      { type: 'parent', code: '3050000', name: '買掛金', balance: 50, warningCodes: [] },
    ] });
    const wb = buildWorkbook(data);
    const ws = wb.worksheets[0];
    const r = ws.getRow(5);
    assert.equal(r.getCell(1).value, '3050000');
    assert.equal(r.getCell(2).value, '買掛金');
  });

  it('TB-W005 line gets red fill', () => {
    const data = v2({ lines: [
      { type: 'account', code: '1000000', name: '現金', balance: -50, endingDebit: 0, endingCredit: 50, warningCodes: ['TB-W005'] },
    ] });
    const wb = buildWorkbook(data);
    const ws = wb.worksheets[0];
    const r = ws.getRow(5);
    assert.ok(r.fill && r.fill.fgColor);
  });

  it('totals row in last position with TOTAL label', () => {
    const data = v2({ lines: [{ type: 'account', code: '1000000', name: '現金', balance: 100, warningCodes: [] }] });
    const wb = buildWorkbook(data);
    const ws = wb.worksheets[0];
    const last = ws.getRow(ws.rowCount);
    assert.equal(last.getCell(1).value, 'TOTAL');
    assert.equal(last.font.bold, true);
    assert.equal(last.getCell(5).value, 230);  // movementDebit from meta
    assert.equal(last.getCell(9).value, 130);  // endingDebit - endingCredit
  });
});

// ---------------------------------------------------------------------------
// Warnings sheet
// ---------------------------------------------------------------------------

describe('buildWorkbook — warnings sheet', () => {
  it('no warnings → no Warnings sheet', () => {
    const wb = buildWorkbook(v2());
    assert.equal(wb.worksheets.length, 1);
  });

  it('with warnings → second sheet "Warnings" with rows', () => {
    const data = v2();
    data.meta.warnings = [
      { code: 'TB-W001', severity: 'critical', title: '借方合計 ≠ 貸方合計', titleVi: 'Tổng Nợ ≠ Tổng Có', detail: { diff: 10 } },
      { code: 'TB-W002', severity: 'high', title: '未承認', titleVi: 'Chưa duyệt', detail: { count: 3 } },
    ];
    const wb = buildWorkbook(data);
    assert.equal(wb.worksheets.length, 2);
    const wsW = wb.worksheets[1];
    assert.equal(wsW.name, 'Warnings');
    // 1 header + 2 data rows
    assert.equal(wsW.rowCount, 3);
  });
});

// ---------------------------------------------------------------------------
// buildXlsxBuffer
// ---------------------------------------------------------------------------

describe('buildXlsxBuffer', () => {
  it('returns a non-empty Buffer', async () => {
    const buf = await buildXlsxBuffer(v2(), { tenantCode: 'T1' });
    assert.ok(buf);
    // exceljs returns an ArrayBuffer-like in node; check size
    const size = buf.byteLength || buf.length || 0;
    assert.ok(size > 0, `expected non-empty buffer, got ${size} bytes`);
  });
});

// ---------------------------------------------------------------------------
// fileNameFor
// ---------------------------------------------------------------------------

describe('fileNameFor', () => {
  it('formats tenantCode + term + YYYYMMDDHHmm', () => {
    const fn = fileNameFor({
      tenantCode: 'T1',
      term: 5,
      when: new Date(2026, 5, 7, 12, 34),
    });
    assert.equal(fn, 'trial_balance_T1_5_202606071234.xlsx');
  });

  it('zero-pads month/day/hour/minute', () => {
    const fn = fileNameFor({
      tenantCode: 'X',
      term: 1,
      when: new Date(2026, 0, 3, 4, 5),
    });
    assert.equal(fn, 'trial_balance_X_1_202601030405.xlsx');
  });
});
