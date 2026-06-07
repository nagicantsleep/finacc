/**
 * Reconciliation — Issue #199: balanceEngine ending == ledgerLines sums.
 *
 * Proves the canonical engine and the per-account ledger agree on ending
 * balances for the SAME tenant/term/period, over real seeded journal data.
 * Fixture is fixed (not random) for debuggability: 10 account-level lines
 * (BS debit, BS credit, PL, 7020010 edge case) + 5 sub-account lines.
 *
 * Requires a live, migrated Postgres test DB. Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';
import { balanceEngine } from '../../libs/reporting/balance-engine.js';
import { ledgerLines } from '../../libs/ledger.js';
import { numeric } from '../../libs/parse_account_code.js';

const RUN = Date.now().toString(36);
const USER = { name: `recon_${RUN}`.slice(0, 20), password: 'password-1234' };
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

// Post an approved cross slip with explicit debit/credit accounts (+ optional subs).
async function postSlip(agent, month, day, line) {
  const res = await agent.post('/api/cross_slip').send({
    year: YEAR, month, day, term: TERM, lines: [line],
  }).expect(200);
  assert.notEqual(res.body.code, -10, 'user has accounting permission');
  assert.notEqual(res.body.code, -2, 'slip date valid');
}

// Reproduce libs/trial_balance.js's actual entrySource for the whole FY.
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

// Fetch approved CrossSlipDetail rows for one account/sub over the FY, the way
// libs/crossslipdetails.js does, for feeding ledgerLines.
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

describe('Reconciliation — engine ending == ledger sums (Issue #199)', function () {
  this.timeout(120000);

  const Op = models.Sequelize.Op;
  let agent, tenantId, fy;
  let engineByKey; // Map code|code:sub -> engine line

  // Fixed fixture (verified present in the seeded chart of accounts).
  const ACCOUNTS = [
    '1000000', '1010000', '1010010', // BS debit
    '3000000', '3010000',            // BS credit
    '6000000', '7000000', '7010000', // PL
    '7020010',                       // edge case (dc override C)
  ];
  // Sub-having accounts: 3050000 (C, subs 1..4), 7030020 (D, subs 1..4).
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

    // Seed account-level entries (each balanced against a counter account).
    // 1000000(D) ← 3000000(C): asset up, equity up
    await postSlip(agent, 2, 1, { debitAccount: '1000000', debitAmount: 120000, creditAccount: '3000000', creditAmount: 120000 });
    // 1010000(D) ← 3010000(C)
    await postSlip(agent, 2, 2, { debitAccount: '1010000', debitAmount: 80000, creditAccount: '3010000', creditAmount: 80000 });
    // 1010010(D) ← 6000000(C revenue): cash from sales
    await postSlip(agent, 3, 1, { debitAccount: '1010010', debitAmount: 50000, creditAccount: '6000000', creditAmount: 50000 });
    // 7000000(D expense) ← 1000000(C): pay an expense out of cash
    await postSlip(agent, 3, 2, { debitAccount: '7000000', debitAmount: 15000, creditAccount: '1000000', creditAmount: 15000 });
    // 7010000(D expense) ← 1010000(C)
    await postSlip(agent, 4, 1, { debitAccount: '7010000', debitAmount: 9000, creditAccount: '1010000', creditAmount: 9000 });
    // 7020010(C edge: 期末商品棚卸高) ← 1010010(D)
    await postSlip(agent, 4, 2, { debitAccount: '1010010', debitAmount: 6000, creditAccount: '7020010', creditAmount: 6000 });

    // Seed sub-account entries (debit a sub of 7030020, credit a sub of 3050000).
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

    // Run the engine once at sub-account granularity for the whole FY.
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

  it('engine ending == ledger sums for 10 fixed account-level lines', async function () {
    for (const code of ACCOUNTS) {
      const eng = engineByKey.get(code);
      assert.ok(eng, `engine should have a line for ${code}`);
      const details = await ledgerDetailsFor(tenantId, fy, code, null, Op);
      // Opening after setup is 0 for all accounts.
      const led = ledgerLines(code, null, { debit: 0, credit: 0, balance: 0 }, details);
      assert.equal(
        numeric(eng.endingBalance), numeric(led.sums.balance),
        `account ${code}: engine ${eng.endingBalance} != ledger ${led.sums.balance}`
      );
    }
  });

  it('engine ending == ledger sums for 5 fixed sub-account lines', async function () {
    for (const { account, sub } of SUBS) {
      const eng = engineByKey.get(`${account}:${sub}`);
      assert.ok(eng, `engine should have a line for ${account}/${sub}`);
      const details = await ledgerDetailsFor(tenantId, fy, account, sub, Op);
      const led = ledgerLines(account, sub, { debit: 0, credit: 0, balance: 0 }, details);
      assert.equal(
        numeric(eng.endingBalance), numeric(led.sums.balance),
        `sub ${account}/${sub}: engine ${eng.endingBalance} != ledger ${led.sums.balance}`
      );
    }
  });

  it('total engine movement debit == credit (global invariant)', function () {
    let d = 0, c = 0;
    for (const l of engineByKey.values()) { d += l.movementDebit; c += l.movementCredit; }
    assert.equal(d, c, `engine movement D=${d} C=${c}`);
  });

  it('7020010 edge case reconciles as C-nature', async function () {
    const eng = engineByKey.get('7020010');
    const details = await ledgerDetailsFor(tenantId, fy, '7020010', null, Op);
    const led = ledgerLines('7020010', null, { debit: 0, credit: 0, balance: 0 }, details);
    assert.equal(numeric(eng.endingBalance), numeric(led.sums.balance));
    assert.equal(numeric(eng.endingBalance), 6000, 'credited 6000, C-nature: 0 - 0 + 6000');
  });
});
