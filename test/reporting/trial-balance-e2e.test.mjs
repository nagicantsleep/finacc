/**
 * E2E / integration — Issue #196: trial balance served by balanceEngine.
 *
 * Drives the real Express app over HTTP (supertest), self-seeds real data:
 *   signup → setup (fiscal year + chart of accounts) → post approved journal
 *   entries → GET /api/trial-balance → assert engine math is correct.
 *
 * Requires a live, migrated Postgres test DB (hieronymus_test). Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';
import { dc, numeric } from '../../libs/parse_account_code.js';

const RUN = Date.now().toString(36);
const USER = { name: `tbe2e_${RUN}`.slice(0, 20), password: 'password-1234' };

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
  assert.equal(loginRes.body.result, 'OK', `login failed for ${user.name}`);
  return agent;
}

describe('E2E — trial balance served by balanceEngine (real data)', function () {
  this.timeout(60000);

  let agent;
  let tenantId;
  const term = 1;
  const year = 2026;
  const setupBody = {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    term,
    year,
    companyClass: 0,
    roundingMethod: 0,
  };

  let dAcc; // debit-nature account
  let cAcc; // credit-nature account

  before(async function () {
    agent = await signupAndLogin(USER);
    const res = await agent.post('/api/setup').send(setupBody).expect(200);
    assert.equal(res.body.code, 0, `setup failed: ${JSON.stringify(res.body)}`);

    const u = await models.User.findOne({ where: { name: USER.name } });
    const m = await models.TenantMember.findOne({ where: { userId: u.id, isDefault: true } });
    tenantId = m.tenantId;

    const accounts = await models.Account.findAll({
      where: { tenantId },
      order: [['accountCode', 'ASC']],
    });
    // Prefer accounts without sub-accounts so account-level posting is unambiguous.
    const noSub = accounts.filter((a) => !a.subAccountCount || a.subAccountCount === 0);
    dAcc = noSub.find((a) => dc(a.accountCode) === 'D');
    cAcc = noSub.find((a) => dc(a.accountCode) === 'C');
    assert.ok(dAcc, 'expected at least one debit-nature account from setup');
    assert.ok(cAcc, 'expected at least one credit-nature account from setup');
  });

  it('setup seeded a fiscal year, chart of accounts, and opening remainings', async function () {
    const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
    assert.ok(fy, 'fiscal year for term 1 should exist');
    const accCount = await models.Account.count({ where: { tenantId } });
    assert.ok(accCount > 0, 'accounts should be seeded');
    const remCount = await models.AccountRemaining.count({ where: { tenantId, term } });
    assert.ok(remCount > 0, 'opening remainings should be seeded at the same term');
  });

  it('posts an approved journal entry (debit D / credit C) and TB reflects it', async function () {
    const postRes = await agent
      .post('/api/cross_slip')
      .send({
        year,
        month: 4,
        day: 15,
        term,
        lines: [{
          debitAccount: dAcc.accountCode,
          debitAmount: 10000,
          creditAccount: cAcc.accountCode,
          creditAmount: 10000,
        }],
      })
      .expect(200);
    assert.notEqual(postRes.body.code, -10, 'user should have accounting permission');
    assert.notEqual(postRes.body.code, -2, 'slip date should be valid');

    // The owner is approvable → slip auto-approves on create.
    const slip = await models.CrossSlip.findOne({ where: { tenantId, year, month: 4 } });
    assert.ok(slip, 'cross slip should be persisted');
    assert.ok(slip.approvedAt, 'owner-created slip should be auto-approved');

    const tb = await agent.get('/api/trial-balance').expect(200);
    const lines = tb.body;
    const dLine = lines.find((l) => l.code === dAcc.accountCode);
    const cLine = lines.find((l) => l.code === cAcc.accountCode);
    assert.ok(dLine, `debit account ${dAcc.accountCode} should appear in TB`);
    assert.ok(cLine, `credit account ${cAcc.accountCode} should appear in TB`);

    assert.equal(numeric(dLine.debit), 10000, 'debit movement recorded');
    assert.equal(numeric(dLine.credit), 0);
    assert.equal(numeric(cLine.credit), 10000, 'credit movement recorded');
    assert.equal(numeric(cLine.debit), 0);

    // D-nature: ending = pickup + debit - credit; C-nature: pickup - debit + credit.
    assert.equal(numeric(dLine.balance), numeric(dLine.pickup) + 10000, 'D ending');
    assert.equal(numeric(cLine.balance), numeric(cLine.pickup) + 10000, 'C ending');
  });

  it('debit total movement equals credit total movement (TB invariant)', async function () {
    const tb = await agent.get('/api/trial-balance').expect(200);
    const lines = tb.body.filter((l) => l.code);
    const totalDebit = lines.reduce((s, l) => s + numeric(l.debit), 0);
    const totalCredit = lines.reduce((s, l) => s + numeric(l.credit), 0);
    assert.equal(totalDebit, totalCredit, `D=${totalDebit} C=${totalCredit}`);
    assert.ok(totalDebit >= 10000, 'at least the posted entry is present');
  });

  it('monthly view isolates a single month of movement', async function () {
    // Second entry in a different month (May).
    await agent
      .post('/api/cross_slip')
      .send({
        year,
        month: 5,
        day: 10,
        term,
        lines: [{
          debitAccount: dAcc.accountCode,
          debitAmount: 7000,
          creditAccount: cAcc.accountCode,
          creditAmount: 7000,
        }],
      })
      .expect(200);

    const april = await agent.get(`/api/trial-balance/${year}-4`).expect(200);
    const aprilD = april.body.find((l) => l.code === dAcc.accountCode);
    assert.equal(numeric(aprilD.debit), 10000, 'April view shows only April movement');

    const may = await agent.get(`/api/trial-balance/${year}-5`).expect(200);
    const mayD = may.body.find((l) => l.code === dAcc.accountCode);
    assert.equal(numeric(mayD.debit), 7000, 'May view shows only May movement');

    // Annual view accumulates both.
    const annual = await agent.get('/api/trial-balance').expect(200);
    const annualD = annual.body.find((l) => l.code === dAcc.accountCode);
    assert.equal(numeric(annualD.debit), 17000, 'annual view sums all months');
    assert.equal(numeric(annualD.balance), numeric(annualD.pickup) + 17000);
  });

  it('TB excludes unapproved entries', async function () {
    // Create a slip as the owner (auto-approved), then un-approve it directly,
    // and confirm the engine (includeUnapproved=false) drops it.
    await agent
      .post('/api/cross_slip')
      .send({
        year,
        month: 6,
        day: 1,
        term,
        lines: [{
          debitAccount: dAcc.accountCode,
          debitAmount: 5000,
          creditAccount: cAcc.accountCode,
          creditAmount: 5000,
        }],
      })
      .expect(200);
    const slip = await models.CrossSlip.findOne({ where: { tenantId, year, month: 6 } });
    slip.approvedAt = null;
    slip.approvedBy = null;
    await slip.save();

    const june = await agent.get(`/api/trial-balance/${year}-6`).expect(200);
    const juneD = june.body.find((l) => l.code === dAcc.accountCode);
    const juneMovement = juneD ? numeric(juneD.debit) : 0;
    assert.equal(juneMovement, 0, 'unapproved June entry must not appear in TB');
  });
});
