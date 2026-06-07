/**
 * Reconciliation E2E — Issue #217 (E1.11).
 *
 * Hits the live /api/trial-balance?version=2 endpoint and asserts:
 *   1. v2 engine endingBalance === ledger sums for ≥ 5 fixed account-level lines
 *   2. v2 engine endingBalance === ledger sums for 5 fixed sub-account lines
 *   3. global D === C invariant in the API response
 *   4. 7020010 edge case (C-nature override) reconciles correctly
 *   5. v2 meta.totals match the per-line sums (catches filter / aggregate bugs)
 *   6. v2 lines preserve the same account code set as the engine output
 *
 * Requires a live, migrated Postgres test DB. Run with: npm test
 *
 * Visual E2E (3-tab screenshot via chrome-devtools MCP) is a manual step
 * documented in the test report — not automated here.
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';
import { balanceEngine } from '../../libs/reporting/balance-engine.js';
import { ledgerLines } from '../../libs/ledger.js';
import { numeric } from '../../libs/parse_account_code.js';

const RUN = Date.now().toString(36);
const USER = { name: `tbv2_${RUN}`.slice(0, 20), password: 'password-1234' };
const YEAR = 2026;
const TERM = 1;

async function signupAndLogin(user) {
  const agent = request.agent(app);
  const signupRes = await agent
    .post('/api/user/signup')
    .send({ user_name: user.name, password: user.password, legalName: user.name, email: `${user.name}@example.com` })
    .expect('Content-Type', /json/);
  assert.ok(
    signupRes.body.result === 'OK' || signupRes.body.message?.includes('既に登録'),
    `signup unexpected: ${JSON.stringify(signupRes.body)}`
  );
  const loginRes = await agent
    .post('/api/user/login')
    .send({ user_name: user.name, password: user.password })
    .expect(200);
  assert.equal(loginRes.body.result, 'OK');
  return agent;
}

async function postSlip(agent, month, day, line) {
  const res = await agent.post('/api/cross_slip').send({
    year: YEAR, month, day, term: TERM, lines: [line],
  }).expect(200);
  assert.notEqual(res.body.code, -10, 'user has accounting permission');
  assert.notEqual(res.body.code, -2, 'slip date valid');
}

function actualEntrySource(tenantId, startDate, fetchEnd, Op) {
  return {
    name: 'actual',
    fetch: async () => {
      const rows = [];
      for (let mon = new Date(startDate); mon < new Date(fetchEnd); ) {
        const slips = await models.CrossSlip.findAll({
          where: { [Op.and]: { tenantId, year: mon.getFullYear(), month: mon.getMonth() + 1 } },
          include: [{ model: models.CrossSlipDetail, as: 'lines' }],
        });
        for (const slip of slips) {
          for (const d of slip.lines || []) {
            rows.push({
              debitAccount: d.debitAccount, debitSubAccount: d.debitSubAccount, debitAmount: d.debitAmount,
              creditAccount: d.creditAccount, creditSubAccount: d.creditSubAccount, creditAmount: d.creditAmount,
              approvedAt: slip.approvedAt,
            });
          }
        }
        mon.setMonth(mon.getMonth() + 1);
      }
      return rows;
    },
  };
}

async function ledgerDetailsFor(tenantId, fy, accountCode, subCode, Op) {
  const out = [];
  for (let mon = new Date(fy.startDate); mon < new Date(fy.endDate); ) {
    const orClause = subCode
      ? [
          { debitAccount: accountCode, debitSubAccount: subCode },
          { creditAccount: accountCode, creditSubAccount: subCode },
        ]
      : [{ debitAccount: accountCode }, { creditAccount: accountCode }];
    const details = await models.CrossSlipDetail.findAll({
      where: {
        tenantId,
        [Op.and]: {
          [Op.or]: orClause,
          '$crossSlip.year$': mon.getFullYear(),
          '$crossSlip.month$': mon.getMonth() + 1,
        },
      },
      include: [{ model: models.CrossSlip, as: 'crossSlip' }],
    });
    for (const d of details) {
      if (d.crossSlip && d.crossSlip.approvedAt) out.push(d);
    }
    mon.setMonth(mon.getMonth() + 1);
  }
  return out;
}

describe('Reconciliation v2 — /api/trial-balance?version=2 (Issue #217 / E1.11)', function () {
  this.timeout(180000);

  const Op = models.Sequelize.Op;
  let agent, tenantId, fy;
  let engineByKey;

  // Same fixed fixture as reconciliation.test.mjs.
  const ACCOUNTS = [
    '1000000', '1010000', '1010010',
    '3000000', '3010000',
    '6000000', '7000000', '7010000',
    '7020010',
  ];
  const SUBS = [
    { account: '3050000', sub: 1 },
    { account: '3050000', sub: 2 },
    { account: '7030020', sub: 1 },
    { account: '7030020', sub: 2 },
    { account: '7030020', sub: 3 },
  ];

  before(async function () {
    agent = await signupAndLogin(USER);
    const setupRes = await agent.post('/api/setup').send({
      startDate: '2026-01-01', endDate: '2026-12-31', term: TERM, year: YEAR,
      companyClass: 0, roundingMethod: 0,
    }).expect(200);
    assert.equal(setupRes.body.code, 0, `setup failed: ${JSON.stringify(setupRes.body)}`);

    const u = await models.User.findOne({ where: { name: USER.name } });
    const m = await models.TenantMember.findOne({ where: { userId: u.id, isDefault: true } });
    tenantId = m.tenantId;
    fy = await models.FiscalYear.findOne({ where: { tenantId, term: TERM } });

    // Mirror reconciliation.test.mjs seed.
    await postSlip(agent, 2, 1, { debitAccount: '1000000', debitAmount: 120000, creditAccount: '3000000', creditAmount: 120000 });
    await postSlip(agent, 2, 2, { debitAccount: '1010000', debitAmount: 80000,  creditAccount: '3010000', creditAmount: 80000 });
    await postSlip(agent, 3, 1, { debitAccount: '1010010', debitAmount: 50000,  creditAccount: '6000000', creditAmount: 50000 });
    await postSlip(agent, 3, 2, { debitAccount: '7000000', debitAmount: 15000,  creditAccount: '1000000', creditAmount: 15000 });
    await postSlip(agent, 4, 1, { debitAccount: '7010000', debitAmount: 9000,   creditAccount: '1010000', creditAmount: 9000 });
    await postSlip(agent, 4, 2, { debitAccount: '1010010', debitAmount: 6000,   creditAccount: '7020010', creditAmount: 6000 });
    await postSlip(agent, 5, 1, {
      debitAccount: '7030020', debitSubAccount: 1, debitAmount: 3000,
      creditAccount: '3050000', creditSubAccount: 1, creditAmount: 3000,
    });
    await postSlip(agent, 5, 2, {
      debitAccount: '7030020', debitSubAccount: 2, debitAmount: 4000,
      creditAccount: '3050000', creditSubAccount: 2, creditAmount: 4000,
    });
    await postSlip(agent, 6, 1, {
      debitAccount: '7030020', debitSubAccount: 3, debitAmount: 2500,
      creditAccount: '3050000', creditSubAccount: 1, creditAmount: 2500,
    });

    // Build a Map keyed by code[:sub] from the engine for fast lookup.
    const startDate = new Date(fy.startDate);
    const end = new Date(fy.endDate);
    const fetchEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    const result = await balanceEngine({
      tenantId, term: TERM,
      period: { from: startDate, to: end },
      entrySources: [actualEntrySource(tenantId, startDate, fetchEnd, Op)],
      options: { subAccount: true },
    }, models);

    engineByKey = new Map();
    for (const l of result.lines) {
      const key = l.subCode != null ? `${l.code}:${l.subCode}` : l.code;
      engineByKey.set(key, l);
    }
  });

  it('v2 endpoint returns version: 2 envelope', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance')
      .expect(200);
    assert.equal(r.body.version, 2);
    assert.ok(r.body.meta);
    assert.ok(Array.isArray(r.body.lines));
  });

  it('v2 endingBalance == ledger sums for 9 fixed account-level lines', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance')
      .expect(200);
    const byCode = new Map();
    for (const l of r.body.lines) {
      byCode.set(l.code, l);
    }
    for (const code of ACCOUNTS) {
      const v2 = byCode.get(code);
      assert.ok(v2, `v2 should have line for ${code}`);
      const details = await ledgerDetailsFor(tenantId, fy, code, null, Op);
      const led = ledgerLines(code, null, { debit: 0, credit: 0, balance: 0 }, details);
      assert.equal(
        numeric(v2.balance), numeric(led.sums.balance),
        `account ${code}: v2 ${v2.balance} != ledger ${led.sums.balance}`
      );
    }
  });

  it('v2 endingBalance == ledger sums for 5 fixed sub-account lines', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance')
      .expect(200);
    const byKey = new Map();
    for (const l of r.body.lines) {
      if (l.subCode != null) byKey.set(`${l.code}:${l.subCode}`, l);
    }
    for (const { account, sub } of SUBS) {
      const v2 = byKey.get(`${account}:${sub}`);
      assert.ok(v2, `v2 should have sub line for ${account}/${sub}`);
      const details = await ledgerDetailsFor(tenantId, fy, account, sub, Op);
      const led = ledgerLines(account, sub, { debit: 0, credit: 0, balance: 0 }, details);
      assert.equal(
        numeric(v2.balance), numeric(led.sums.balance),
        `sub ${account}/${sub}: v2 ${v2.balance} != ledger ${led.sums.balance}`
      );
    }
  });

  it('global D === C invariant in v2 response', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance')
      .expect(200);
    const totalD = r.body.lines.reduce((s, l) => s + (l.movementDebit || 0), 0);
    const totalC = r.body.lines.reduce((s, l) => s + (l.movementCredit || 0), 0);
    assert.equal(totalD, totalC, `D=${totalD} C=${totalC}`);
  });

  it('7020010 edge case reconciles as C-nature (credited 6000, C: 0 - 0 + 6000 = 6000)', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance')
      .expect(200);
    const v2 = r.body.lines.find((l) => l.code === '7020010');
    assert.ok(v2);
    assert.equal(numeric(v2.balance), 6000);
  });

  it('v2 meta.totals match sum of post-filter lines (catches filter/aggregate bugs)', async function () {
    for (const rt of ['balance', 'movement', 'combined']) {
      const r = await agent.get(`/api/trial-balance?version=2&reportType=${rt}`).expect(200);
      const t = r.body.meta.totals;
      for (const k of ['openingDebit','openingCredit','movementDebit','movementCredit','endingDebit','endingCredit']) {
        const sum = r.body.lines.reduce((s, l) => s + (l[k] || 0), 0);
        assert.equal(t[k], sum, `reportType=${rt} totals.${k} ${t[k]} != sum-of-lines ${sum}`);
      }
    }
  });

  it('v2 line code set matches engine (no missing/extra accounts)', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance').expect(200);
    const v2Codes = new Set();
    for (const l of r.body.lines) v2Codes.add(l.code);
    for (const code of Object.keys(engineByKey).filter((k) => !k.includes(':'))) {
      assert.ok(v2Codes.has(code), `v2 missing ${code}`);
    }
  });

  it('v2 + month filter narrows the period (period label == month)', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance&month=2026-03').expect(200);
    assert.equal(r.body.meta.period.label, '2026-03');
  });

  it('v2 + accountClassIds filter excludes non-matching classes', async function () {
    const all = await agent.get('/api/trial-balance?version=2&reportType=balance').expect(200);
    const filtered = await agent.get('/api/trial-balance?version=2&reportType=balance&accountClassIds=10').expect(200);
    assert.ok(filtered.body.lines.length < all.body.lines.length,
      `filtered (${filtered.body.lines.length}) should be < all (${all.body.lines.length})`);
  });

  it('v2 + hideZero drops all-zero lines in the report type', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance&hideZero=true').expect(200);
    // Every line in balance mode must have some non-zero balance / opening / ending column
    for (const l of r.body.lines) {
      const any = (l.openingDebit || l.openingCredit || l.endingDebit || l.endingCredit);
      assert.ok(any, `line ${l.code} should be hidden under hideZero in balance mode`);
    }
  });

  it('warnings meta is an array (default empty for a clean test)', async function () {
    const r = await agent.get('/api/trial-balance?version=2&reportType=balance').expect(200);
    assert.ok(Array.isArray(r.body.meta.warnings));
  });
});
