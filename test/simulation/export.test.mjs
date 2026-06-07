/**
 * Simulation export — Issue #239 (E2.11).
 *
 * Verifies buildScenarioExport produces a valid xlsx buffer with the
 * SIMULATION badge header and the requested sheets.
 */

import { strict as assert } from 'node:assert';
import ExcelJS from 'exceljs';
import models from '../../models/index.js';
import { buildScenarioExport } from '../../libs/simulation/export.js';

describe('Simulation — E2.11 export', function () {
  this.timeout(30000);

  let tenant;
  let otherTenant;
  let user;
  let fy;
  let accountClass;
  let da;
  let ca;
  let scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({ slug: `s2x-${stamp}`, name: `S2X ${stamp}` });
    otherTenant = await models.Tenant.create({ slug: `s2x-${stamp}-b`, name: `S2X B ${stamp}` });
    user = await models.User.create({
      name: `s2x_u_${stamp}`.slice(0, 20), hashPassword: 'x', legalName: 'XU', email: `${stamp}-x@example.com`,
    });
    fy = await models.FiscalYear.create({ tenantId: tenant.id, term: 1, startDate: '2026-01-01', endDate: '2026-12-31' });
    accountClass = await models.AccountClass.create({ tenantId: tenant.id, major: 'Asset', middle: 'Cash', minor: 'Bank', field: 1 });
    da = await models.Account.create({ tenantId: tenant.id, accountCode: '10200000', name: 'Cash', accountClassId: accountClass.id });
    ca = await models.Account.create({ tenantId: tenant.id, accountCode: '20200000', name: 'A/P', accountClassId: accountClass.id });
    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'export scenario', baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-12-31',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      status: 'locked', ownerId: user.id, visibility: 'private',
      lockedAt: new Date('2026-06-01T10:00:00Z'), lockedBy: user.id,
    });
    await models.SimulationEntry.create({
      tenantId: tenant.id, scenarioId: scenario.id, date: '2026-08-15',
      debitAccount: '10200000', debitAmount: 500, creditAccount: '20200000', creditAmount: 500, memo: 'projected',
    });
  });

  after(async function () {
    if (scenario) { await models.SimulationEntry.destroy({ where: { scenarioId: scenario.id } }); await scenario.destroy(); }
    if (da) await da.destroy();
    if (ca) await ca.destroy();
    if (accountClass) await accountClass.destroy();
    if (fy) await fy.destroy();
    if (user) await user.destroy();
    if (tenant) await tenant.destroy();
    if (otherTenant) await otherTenant.destroy();
  });

  async function loadWb(buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    return wb;
  }

  it('trial-balance export has badge header + Trial Balance sheet', async function () {
    const out = await buildScenarioExport(tenant.id, scenario.id, 'trial-balance', 'XU');
    assert.equal(out.error, undefined);
    assert.ok(out.buffer);
    assert.match(out.fileName, /simulation_.*_trial-balance\.xlsx/);
    const wb = await loadWb(out.buffer);
    const ws = wb.getWorksheet('Trial Balance');
    assert.ok(ws, 'Trial Balance sheet exists');
    assert.match(String(ws.getRow(1).getCell(1).value), /SIMULATION - NOT OFFICIAL/);
    assert.match(String(ws.getRow(2).getCell(1).value), /Status: locked/);
    assert.match(String(ws.getRow(2).getCell(1).value), /locked:/);
  });

  it('comparison export has Comparison sheet', async function () {
    const out = await buildScenarioExport(tenant.id, scenario.id, 'comparison', 'XU');
    assert.equal(out.error, undefined);
    const wb = await loadWb(out.buffer);
    assert.ok(wb.getWorksheet('Comparison'), 'Comparison sheet exists');
  });

  it('full export has 3 sheets', async function () {
    const out = await buildScenarioExport(tenant.id, scenario.id, 'full', 'XU');
    assert.equal(out.error, undefined);
    const wb = await loadWb(out.buffer);
    assert.ok(wb.getWorksheet('Trial Balance'));
    assert.ok(wb.getWorksheet('Comparison'));
    assert.ok(wb.getWorksheet('Entries'));
  });

  it('returns 404 for cross-tenant scenario', async function () {
    const out = await buildScenarioExport(otherTenant.id, scenario.id, 'full', 'XU');
    assert.equal(out.code, 404);
  });
});
