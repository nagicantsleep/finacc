/**
 * Simulation Excel export — Issue #239 (E2.11).
 *
 * Reuses the E1.7 workbook builder for the trial-balance sheet, then prepends
 * a SIMULATION badge header and (for type=full) adds Comparison + Entries
 * sheets. Three export types:
 *   - trial-balance : 1 sheet (simulated TB)
 *   - comparison    : 1 sheet (actual vs simulated)
 *   - full          : Trial Balance + Comparison + Entries
 *
 * Header rows on every sheet:
 *   Row 1: SIMULATION - NOT OFFICIAL ACCOUNTING REPORT
 *   Row 2: Scenario: <name>, Status: <draft|locked>, Not for tax filing
 *          (+ locked: <ts> by <user> when applicable)
 *   Row 3: Generated at <ISO>, by <user>
 */

import ExcelJS from 'exceljs';
import models from '../../models/index.js';
import { simulatedTrialBalance } from './trial-balance.js';
import { comparisonReport } from './comparison.js';
import { buildSubtotals } from '../reporting/tb-subtotal.js';

const NUM_FMT = '#,##0;[Red]-#,##0';

function badgeRows(ws, scenario, actorName) {
  const r1 = ws.getRow(1);
  r1.getCell(1).value = 'SIMULATION - NOT OFFICIAL ACCOUNTING REPORT';
  r1.font = { bold: true, color: { argb: 'FFC00000' }, size: 13 };
  r1.commit();

  const r2 = ws.getRow(2);
  let line = `Scenario: ${scenario.name}, Status: ${scenario.status}, Not for tax filing`;
  if (scenario.lockedAt) {
    const ts = scenario.lockedAt instanceof Date ? scenario.lockedAt.toISOString().slice(0, 16) : String(scenario.lockedAt);
    line += ` (locked: ${ts}${scenario.lockedBy ? `, by ${scenario.lockedBy}` : ''})`;
  }
  r2.getCell(1).value = line;
  r2.font = { italic: true };
  r2.commit();

  const r3 = ws.getRow(3);
  r3.getCell(1).value = `Generated at ${new Date().toISOString()}${actorName ? `, by ${actorName}` : ''}`;
  r3.font = { color: { argb: 'FF888888' } };
  r3.commit();
}

function addTrialBalanceSheet(wb, scenario, tb, actorName) {
  const ws = wb.addWorksheet('Trial Balance', { views: [{ state: 'normal', showGridLines: false }] });
  ws.columns = [
    { width: 14 }, { width: 32 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
  ];
  badgeRows(ws, scenario, actorName);
  const header = ws.getRow(5);
  ['科目 / Mã', '科目名 / Tên', '期首借方', '期首貸方', '期間借方', '期間貸方', '期末借方', '期末貸方', '残高'].forEach((h, i) => {
    header.getCell(i + 1).value = h;
  });
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  header.commit();

  const lines = buildSubtotals(tb.lines || []);
  let row = 6;
  for (const l of lines) {
    const r = ws.getRow(row);
    const isSub = l.type === 'subtotal';
    r.getCell(1).value = isSub ? `【${l.level || ''}】` : (l.subCode != null ? `${l.code}-${l.subCode}` : (l.code || ''));
    r.getCell(2).value = isSub ? (l.name || '') : (l.subName || l.name || '');
    r.getCell(3).value = l.openingDebit || 0;
    r.getCell(4).value = l.openingCredit || 0;
    r.getCell(5).value = l.movementDebit || 0;
    r.getCell(6).value = l.movementCredit || 0;
    r.getCell(7).value = l.endingDebit || 0;
    r.getCell(8).value = l.endingCredit || 0;
    r.getCell(9).value = l.balance || 0;
    for (let c = 3; c <= 9; c += 1) { r.getCell(c).numFmt = NUM_FMT; r.getCell(c).alignment = { horizontal: 'right' }; }
    if (isSub) { r.font = { bold: true }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } }; }
    row += 1;
  }
}

function addComparisonSheet(wb, scenario, cmp, actorName) {
  const ws = wb.addWorksheet('Comparison', { views: [{ state: 'normal', showGridLines: false }] });
  ws.columns = [{ width: 14 }, { width: 32 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 10 }];
  badgeRows(ws, scenario, actorName);
  const header = ws.getRow(5);
  ['科目 / Mã', '科目名 / Tên', '実績 / Thực tế', '調整 / Điều chỉnh', '予測 / Mô phỏng', '差異 / Chênh lệch', '差異%'].forEach((h, i) => {
    header.getCell(i + 1).value = h;
  });
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  header.commit();
  let row = 6;
  for (const l of cmp.lines || []) {
    const r = ws.getRow(row);
    r.getCell(1).value = l.subCode != null ? `${l.code}-${l.subCode}` : (l.code || '');
    r.getCell(2).value = l.name || '';
    r.getCell(3).value = l.actual.endingBalance || 0;
    r.getCell(4).value = l.adjustment.endingBalance || 0;
    r.getCell(5).value = l.simulated.endingBalance || 0;
    r.getCell(6).value = l.difference || 0;
    r.getCell(7).value = l.differencePct == null ? '' : Number(l.differencePct.toFixed(1));
    for (let c = 3; c <= 6; c += 1) { r.getCell(c).numFmt = NUM_FMT; r.getCell(c).alignment = { horizontal: 'right' }; }
    row += 1;
  }
}

function addEntriesSheet(wb, scenario, entries, actorName) {
  const ws = wb.addWorksheet('Entries', { views: [{ state: 'normal', showGridLines: false }] });
  ws.columns = [{ width: 12 }, { width: 14 }, { width: 8 }, { width: 16 }, { width: 14 }, { width: 8 }, { width: 16 }, { width: 30 }];
  badgeRows(ws, scenario, actorName);
  const header = ws.getRow(5);
  ['日付 / Ngày', '借方科目', '補助', '借方金額', '貸方科目', '補助', '貸方金額', '摘要 / Diễn giải'].forEach((h, i) => {
    header.getCell(i + 1).value = h;
  });
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  header.commit();
  let row = 6;
  for (const e of entries) {
    const r = ws.getRow(row);
    r.getCell(1).value = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
    r.getCell(2).value = e.debitAccount;
    r.getCell(3).value = e.debitSubAccount || '';
    r.getCell(4).value = Number(e.debitAmount) || 0;
    r.getCell(5).value = e.creditAccount;
    r.getCell(6).value = e.creditSubAccount || '';
    r.getCell(7).value = Number(e.creditAmount) || 0;
    r.getCell(8).value = e.memo || '';
    r.getCell(4).numFmt = NUM_FMT; r.getCell(7).numFmt = NUM_FMT;
    row += 1;
  }
}

export async function buildScenarioExport(tenantId, scenarioId, type, actorName) {
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  if (!scenario) return { error: 'scenario not found', code: 404 };

  const wb = new ExcelJS.Workbook();
  wb.creator = 'kaikei';
  wb.created = new Date();

  const wantTb = type === 'trial-balance' || type === 'full';
  const wantCmp = type === 'comparison' || type === 'full';
  const wantEntries = type === 'full';

  if (wantTb) {
    const tb = await simulatedTrialBalance(tenantId, scenarioId, { reportType: 'combined' });
    if (tb.error) return tb;
    addTrialBalanceSheet(wb, scenario, tb.result, actorName);
  }
  if (wantCmp) {
    const cmp = await comparisonReport(tenantId, scenarioId, { reportType: 'combined' });
    if (cmp.error) return cmp;
    addComparisonSheet(wb, scenario, cmp.result, actorName);
  }
  if (wantEntries) {
    const entries = await models.SimulationEntry.findAll({
      where: { tenantId, scenarioId },
      order: [['date', 'ASC'], ['id', 'ASC']],
    });
    addEntriesSheet(wb, scenario, entries, actorName);
  }
  if (wb.worksheets.length === 0) {
    return { error: 'invalid export type', code: 400 };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = scenario.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const fileName = `simulation_${stamp}_${scenarioId}_${type}.xlsx`;
  return { buffer, fileName };
}
