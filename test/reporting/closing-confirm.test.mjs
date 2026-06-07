/**
 * Integration / E2E — Issue #198: closing confirm + AuditEvent.
 *
 * Drives the real Express app over HTTP against Postgres (hieronymus_test):
 *   - GET /api/closing/:term/confirm returns the checklist + PL precheck
 *   - POST /api/closing/:term is admin-gated (403 otherwise)
 *   - POST rejects when next term has non-zero PL and plResetAcknowledged is
 *     missing (409), and succeeds with the flag
 *   - a successful close writes one AuditEvent row (action='closing')
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';

const RUN = Date.now().toString(36);
const mkUser = (tag) => ({ name: `cc_${tag}_${RUN}`.slice(0, 20), password: 'password-1234' });
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

async function setupTenant(agent) {
  const res = await agent.post('/api/setup').send({
    startDate: '2026-01-01', endDate: '2026-12-31', term: TERM, year: YEAR,
    companyClass: 0, roundingMethod: 0,
  }).expect(200);
  assert.equal(res.body.code, 0, `setup failed: ${JSON.stringify(res.body)}`);
}

async function tenantIdOf(name) {
  const u = await models.User.findOne({ where: { name } });
  const m = await models.TenantMember.findOne({ where: { userId: u.id, isDefault: true } });
  return m.tenantId;
}

describe('Integration — closing confirm + AuditEvent (Issue #198)', function () {
  this.timeout(90000);

  let agent, tenantId, user;

  before(async function () {
    user = mkUser('admin');
    agent = await signupAndLogin(user);
    await setupTenant(agent);
    tenantId = await tenantIdOf(user.name);

    // One approved revenue entry so the term has balanced movement.
    const accounts = await models.Account.findAll({ where: { tenantId }, order: [['accountCode', 'ASC']] });
    const noSub = accounts.filter((a) => !a.subAccountCount);
    const asset = noSub.find((a) => /^1/.test(a.accountCode));
    const revenue = noSub.find((a) => /^600/.test(a.accountCode));
    await agent.post('/api/cross_slip').send({
      year: YEAR, month: 3, day: 1, term: TERM,
      lines: [{ debitAccount: asset.accountCode, debitAmount: 40000, creditAccount: revenue.accountCode, creditAmount: 40000 }],
    }).expect(200);
  });

  it('GET /api/closing/:term/confirm returns checklist data', async function () {
    const res = await agent.get(`/api/closing/${TERM}/confirm`).expect(200);
    assert.equal(res.body.result, 'OK');
    assert.equal(res.body.term, TERM);
    assert.equal(res.body.nextTerm, TERM + 1);
    assert.equal(res.body.totals.balanced, true, 'seeded entry is balanced');
    assert.equal(res.body.checklist.allApproved, true, 'owner auto-approves slips');
    assert.ok(res.body.plPrecheck, 'plPrecheck present');
    assert.equal(res.body.plPrecheck.hasNonZeroPL, false, 'no next-term PL before any close');
  });

  it('POST /api/closing/:term is rejected for non-admin (403)', async function () {
    const member = mkUser('member');
    const memberAgent = await signupAndLogin(member);
    await setupTenant(memberAgent); // member owns their own tenant (term 1)
    const memberTenantId = await tenantIdOf(member.name);

    // Demote: revoke admin on their own default membership (raw update to skip
    // the TenantMember beforeValidate hook that requires tradingName).
    await models.sequelize.query(
      'UPDATE "TenantMembers" SET "administrable" = false WHERE "tenantId" = :tid',
      { replacements: { tid: memberTenantId } }
    );

    const res = await memberAgent.post(`/api/closing/${TERM}`).send({}).expect(403);
    assert.equal(res.body.code, 'FORBIDDEN');
  });

  it('POST closing succeeds for admin and writes one AuditEvent', async function () {
    const before = await models.AuditEvent.count({ where: { tenantId, action: 'closing' } });
    const res = await agent.post(`/api/closing/${TERM}`).send({}).expect(200);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.nextTerm, TERM + 1);

    const after = await models.AuditEvent.count({ where: { tenantId, action: 'closing' } });
    assert.equal(after, before + 1, 'exactly one audit row written');

    const evt = await models.AuditEvent.findOne({
      where: { tenantId, action: 'closing' },
      order: [['id', 'DESC']],
    });
    assert.equal(evt.term, TERM);
    assert.ok(evt.actorId, 'actor recorded');
    assert.ok(evt.payload, 'payload recorded');
    assert.equal(evt.payload.plResetAcknowledged, false);
    assert.ok(evt.payload.totalsSnapshot, 'totals snapshot in payload');

    // BS carry-forward landed in term 2 (closing actually ran).
    const nfy = await models.FiscalYear.findOne({ where: { tenantId, term: TERM + 1 } });
    assert.ok(nfy, 'next fiscal year created');
  });

  it('PL precheck: second close needs plResetAcknowledged (409 → then OK)', async function () {
    // After the first close, term 2 may hold PL rows = 0. Force a non-zero PL
    // remaining in the next term to trigger the precheck deterministically.
    const accounts = await models.Account.findAll({ where: { tenantId } });
    const plAcc = accounts.find((a) => /^600/.test(a.accountCode));
    const nextTerm = TERM + 1;
    let rem = await models.AccountRemaining.findOne({ where: { tenantId, term: nextTerm, accountId: plAcc.id } });
    if (!rem) {
      rem = await models.AccountRemaining.create({ tenantId, term: nextTerm, accountId: plAcc.id, debit: 0, credit: 0, balance: 0 });
    }
    rem.credit = 12345; rem.balance = 12345;
    await rem.save();

    const confirm = await agent.get(`/api/closing/${TERM}/confirm`).expect(200);
    assert.equal(confirm.body.plPrecheck.hasNonZeroPL, true, 'precheck detects non-zero next-term PL');

    const rejected = await agent.post(`/api/closing/${TERM}`).send({}).expect(409);
    assert.equal(rejected.body.code, 'PL_RESET_NOT_ACKNOWLEDGED');

    const ok = await agent.post(`/api/closing/${TERM}`).send({ plResetAcknowledged: true }).expect(200);
    assert.equal(ok.body.code, 0);

    const evt = await models.AuditEvent.findOne({
      where: { tenantId, action: 'closing' },
      order: [['id', 'DESC']],
    });
    assert.equal(evt.payload.plResetAcknowledged, true, 'ack recorded in audit payload');
  });
});
