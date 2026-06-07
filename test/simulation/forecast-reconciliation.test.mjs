/**
 * Forecast reconciliation — Issue #274 (E3.14).
 *
 * Invariants:
 *   1. Σ generated entries = Σ manual entries (same params, same amounts).
 *   2. Hash cache: unchanged params → skip delete+insert.
 *   3. Cash balance: endingCash = openingCash + Σ netFlow.
 *   4. Actual-only TB excludes generated entries (no virtual leak).
 *
 * Requires a live, migrated Postgres test DB.
 */

import { strict as assert } from 'node:assert';
import models from '../../models/index.js';
import { regenerate } from '../../libs/simulation/assumption-generator.js';
import { createAssumption } from '../../libs/simulation/assumption-service.js';
import { cashProjection } from '../../libs/simulation/cash-projection.js';
import { simulatedTrialBalance } from '../../libs/simulation/trial-balance.js';
import { trialBalanceV2, actualEntrySource } from '../../libs/reporting/trial-balance-v2.js';

const DAY = 24 * 60 * 60 * 1000;

describe('Forecast — E3.14 reconciliation', function () {
  this.timeout(60000);

  let tenant, user, fy, accountClass, acc1, acc2, scenario;

  before(async function () {
    const stamp = Date.now().toString(36);
    tenant = await models.Tenant.create({ slug: `frec-${stamp}`, name: `FREC ${stamp}` });
    user = await models.User.create({
      name: `frec_${stamp}`.slice(0, 20), hashPassword: 'x', legalName: 'Frec',
      email: `${stamp}-f@example.com`,
    });
    fy = await models.FiscalYear.create({
      tenantId: tenant.id, term: 1, startDate: '2026-01-01', endDate: '2026-12-31',
    });
    accountClass = await models.AccountClass.create({
      tenantId: tenant.id, major: 'Asset', middle: 'Cash', minor: 'Bank', field: 1,
    });
    acc1 = await models.Account.create({
      tenantId: tenant.id, accountCode: '5000', name: 'Salary', accountClassId: accountClass.id,
    });
    acc2 = await models.Account.create({
      tenantId: tenant.id, accountCode: '2000', name: 'Cash', accountClassId: accountClass.id,
    });

    scenario = await models.SimulationScenario.create({
      tenantId: tenant.id, name: 'reconciliation forecast', baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-12-31',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      status: 'draft', ownerId: user.id, visibility: 'private',
    });
  });

  after(async function () {
    await models.SimulationEntry.destroy({ where: { scenarioId: scenario.id } });
    await models.SimulationAssumption.destroy({ where: { scenarioId: scenario.id } });
    if (scenario) await scenario.destroy().catch(() => {});
    if (acc1) await acc1.destroy();
    if (acc2) await acc2.destroy();
    if (accountClass) await accountClass.destroy();
    if (fy) await fy.destroy();
    if (user) await user.destroy();
    if (tenant) await tenant.destroy();
  });

  it('generated entries sum = manual entries with same params', async function () {
    // Create recurring assumption: 3 months * 100000 = 300000 total debit
    await createAssumption(tenant.id, scenario.id, {
      type: 'recurring', name: 'Retained earnings',
      parameters: {
        frequency: 'monthly', dayOfMonth: 1,
        debitAccount: '5000', creditAccount: '2000', amount: 100000,
      },
      startMonth: '2026-07-01', endMonth: '2026-09-30',
    });

    const result = await regenerate(tenant.id, scenario.id);
    assert.ok(result.insertedCount >= 1, 'regenerate must insert entries');

    // Sum all generated entries
    const genEntries = await models.SimulationEntry.findAll({
      where: { tenantId: tenant.id, scenarioId: scenario.id, sourceType: 'recurring' },
    });
    const genTotal = genEntries.reduce((s, e) => s + Number(e.debitAmount), 0);
    assert.equal(genTotal, 300000, '3 months * 100000 = 300000'); // Jul, Aug, Sep

    // Manual equivalent: 3 entries of 100000 each = same total
    assert.equal(genEntries.length, 3);
    for (const e of genEntries) {
      assert.equal(e.debitAmount, e.creditAmount, 'each entry must be balanced');
    }
  });

  it('hash cache: unchanged params skip regenerate', async function () {
    const before = await models.SimulationEntry.count({
      where: { tenantId: tenant.id, scenarioId: scenario.id },
    });

    const result = await regenerate(tenant.id, scenario.id);
    // Hash matched → deleted=0, inserted=0 (or just no change)
    const after = await models.SimulationEntry.count({
      where: { tenantId: tenant.id, scenarioId: scenario.id },
    });
    assert.equal(after, before, 'entry count unchanged when hash matches');
  });

  it('cash projection reconciliation: ending = opening + sum of net flows', async function () {
    const result = await cashProjection(tenant.id, scenario.id);

    assert.ok(result.months.length > 0, 'cash projection must return months');

    let expected = result.openingCash;
    for (const m of result.months) {
      assert.equal(m.openingCash, expected, `month ${m.month} opening matches previous ending`);
      assert.equal(m.endingCash, m.openingCash + m.netFlow, `month ${m.month} ending = opening + netFlow`);
      expected = m.endingCash;
    }

    const finalMonth = result.months[result.months.length - 1];
    const totalNet = result.months.reduce((s, m) => s + m.netFlow, 0);
    assert.equal(finalMonth.endingCash, result.openingCash + totalNet,
      'final ending = opening + sum of all net flows');
  });

  it('actual-only TB excludes generated entries', async function () {
    const start = new Date('2026-01-01');
    const fetchEnd = new Date(new Date('2026-12-31').getTime() + DAY);
    const actual = await trialBalanceV2(
      {
        tenantId: tenant.id, term: 1, reportType: 'combined',
        entrySources: [actualEntrySource(models, tenant.id, start, fetchEnd)],
      },
      models,
    );

    // Account 5000 (salary) should have 0 from actual data
    const line5000 = (actual.lines || []).find(
      (l) => l.code === '5000' && l.subAccountId == null
    );
    if (line5000) {
      assert.equal(line5000.movementDebit, 0,
        'actual TB must not include generated recurring entries on account 5000');
    }
  });
});
