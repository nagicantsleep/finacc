/**
 * Integration — Issue #197: multi-tenant year-end closing.
 *
 * Drives the real Express app + Sequelize against Postgres (hieronymus_test).
 * Self-seeds a tenant (signup -> setup -> approved journal entries), runs the
 * closing flow, and asserts:
 *   - BS account balances carry forward into the next term's AccountRemaining
 *   - PL accounts reset to 0 in the next term
 *   - 繰越利益剰余金 (5040000) receives net income as a credit carry
 *   - closing(tenantId, term) is tenant-scoped (no cross-tenant bleed)
 *   - the multi-tenant guard throws when tenantId is missing
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';
import closing from '../../forms/closing.js';
import { dc, field, numeric } from '../../libs/parse_account_code.js';

const RUN = Date.now().toString(36);
const mkUser = (tag) => ({ name: `cl_${tag}_${RUN}`.slice(0, 20), password: 'password-1234' });

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
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    term: 1,
    year: 2026,
    companyClass: 0,
    roundingMethod: 0,
  }).expect(200);
  assert.equal(res.body.code, 0, `setup failed: ${JSON.stringify(res.body)}`);
}

async function tenantIdOf(name) {
  const u = await models.User.findOne({ where: { name } });
  const m = await models.TenantMember.findOne({ where: { userId: u.id, isDefault: true } });
  return m.tenantId;
}

describe('Integration — multi-tenant year-end closing (Issue #197)', function () {
  this.timeout(90000);

  let agentA, tenantA;
  const year = 2026;

  // A BS asset account (debit-nature) and a revenue account (credit-nature)
  let bsAsset, revenue;

  before(async function () {
    const userA = mkUser('a');
    agentA = await signupAndLogin(userA);
    await setupTenant(agentA);
    tenantA = await tenantIdOf(userA.name);

    const accounts = await models.Account.findAll({
      where: { tenantId: tenantA },
      order: [['accountCode', 'ASC']],
    });
    const noSub = accounts.filter((a) => !a.subAccountCount || a.subAccountCount === 0);
    bsAsset = noSub.find((a) => parseInt(field(a.accountCode), 10) < 6 && dc(a.accountCode) === 'D');
    revenue = noSub.find((a) => /^600/.test(a.accountCode));
    assert.ok(bsAsset, 'need a BS debit asset account');
    assert.ok(revenue, 'need a revenue (600x) account');

    // Approved entry: debit asset / credit revenue 50000 → net income +50000.
    await agentA.post('/api/cross_slip').send({
      year, month: 3, day: 10, term: 1,
      lines: [{
        debitAccount: bsAsset.accountCode, debitAmount: 50000,
        creditAccount: revenue.accountCode, creditAmount: 50000,
      }],
    }).expect(200);
  });

  it('guard: closing() throws when tenantId is missing', async function () {
    await assert.rejects(() => closing(null, 1), /tenantId is required/);
    await assert.rejects(() => closing(undefined, 1), /tenantId is required/);
  });

  it('guard: closing() throws when term is missing', async function () {
    await assert.rejects(() => closing(tenantA, null), /term is required/);
  });

  it('closes term 1 and carries BS balance forward into term 2', async function () {
    // Pre-closing: term-2 remaining for the asset should not yet reflect the carry.
    await closing(tenantA, 1);

    const nfy = await models.FiscalYear.findOne({ where: { tenantId: tenantA, term: 2 } });
    assert.ok(nfy, 'closing should create the next fiscal year');

    const assetRem = await models.AccountRemaining.findOne({
      where: { tenantId: tenantA, term: 2, accountId: bsAsset.id },
    });
    assert.ok(assetRem, 'asset should have a term-2 remaining row');
    assert.equal(numeric(assetRem.balance), 50000, 'BS asset balance carried into term 2');
  });

  it('resets PL accounts to 0 in the next term', async function () {
    const revRem = await models.AccountRemaining.findOne({
      where: { tenantId: tenantA, term: 2, accountId: revenue.id },
    });
    assert.ok(revRem, 'revenue should have a term-2 remaining row');
    assert.equal(numeric(revRem.debit), 0, 'PL debit reset');
    assert.equal(numeric(revRem.credit), 0, 'PL credit reset');
    assert.equal(numeric(revRem.balance), 0, 'PL balance reset');
  });

  it('carries net income into 繰越利益剰余金 (5040000) as a credit', async function () {
    const re = await models.Account.findOne({
      where: { tenantId: tenantA, accountCode: '5040000' },
    });
    assert.ok(re, 'retained earnings account exists');
    const reRem = await models.AccountRemaining.findOne({
      where: { tenantId: tenantA, term: 2, accountId: re.id },
    });
    assert.ok(reRem, 'retained earnings term-2 remaining exists');
    assert.equal(numeric(reRem.credit), 50000, 'net income carried as credit');
    assert.equal(numeric(reRem.balance), 50000, 'retained earnings balance = net income');
  });

  it('is tenant-scoped: closing tenant A does not touch tenant B', async function () {
    const userB = mkUser('b');
    const agentB = await signupAndLogin(userB);
    await setupTenant(agentB);
    const tenantB = await tenantIdOf(userB.name);

    // Tenant B has only term-1 setup, no term-2 rows yet.
    const beforeCount = await models.AccountRemaining.count({ where: { tenantId: tenantB, term: 2 } });

    // Re-running A's closing must not create/modify B's rows.
    await closing(tenantA, 1);

    const afterCount = await models.AccountRemaining.count({ where: { tenantId: tenantB, term: 2 } });
    assert.equal(afterCount, beforeCount, 'tenant B term-2 rows untouched by tenant A closing');
    assert.equal(beforeCount, 0, 'tenant B was never closed');
  });
});
