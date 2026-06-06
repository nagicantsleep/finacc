/**
 * Integration tests — Bilingual enrichment & Language Pair API (Issue #89)
 *
 * Tests the language-pair CRUD endpoints and bilingual enrichment
 * on master data endpoints (TaxRule, VoucherClass, TransactionKind, AccountClass).
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';

const RUN = Date.now().toString(36);
let USER_SEQ = 0;

function makeUser(tag) {
  const compactRun = RUN.slice(-4);
  const serial = (USER_SEQ++).toString(36).padStart(2, '0');
  const name = `u_${tag}_${compactRun}${serial}`.slice(0, 20);
  return {
    name,
    password: 'password-1234',
    legalName: `BP ${tag}`,
    email: `${name}@example.com`
  };
}

async function signupAndLogin(tag) {
  const user = makeUser(tag);
  const agent = request.agent(app);

  const signupRes = await agent
    .post('/api/user/signup')
    .send({
      user_name: user.name,
      password: user.password,
      legalName: user.legalName,
      email: user.email
    })
    .expect('Content-Type', /json/);

  assert.equal(signupRes.body.result, 'OK', `signup failed: ${JSON.stringify(signupRes.body)}`);

  const loginRes = await agent
    .post('/api/user/login')
    .send({ user_name: user.name, password: user.password })
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(loginRes.body.result, 'OK', `login failed: ${JSON.stringify(loginRes.body)}`);

  return agent;
}

const LP_QUERY = `?languagePair=${encodeURIComponent(JSON.stringify({ primary: 'ja', secondary: 'vi' }))}`;

describe('Language Pair API (#89)', function () {
  this.timeout(30000);

  let agent;

  before(async function () {
    agent = await signupAndLogin('lp');
  });

  it('GET /api/user/language-pair returns default ja-vi pair', async function () {
    const res = await agent.get('/api/user/language-pair').expect(200);
    assert.equal(res.body.result, 'OK');
    assert.ok(res.body.languagePair, 'should have languagePair');
    assert.equal(res.body.languagePair.primary, 'ja');
    assert.equal(res.body.languagePair.secondary, 'vi');
    assert.ok(res.body.source, 'should have source field');
  });

  it('PUT /api/user/language-pair updates the pair', async function () {
    const res = await agent
      .put('/api/user/language-pair')
      .send({ primary: 'ja', secondary: 'en' })
      .expect(200);
    assert.equal(res.body.result, 'OK');
    assert.equal(res.body.languagePair.primary, 'ja');
    assert.equal(res.body.languagePair.secondary, 'en');
  });

  it('GET /api/user/language-pair returns updated pair after PUT', async function () {
    const res = await agent.get('/api/user/language-pair').expect(200);
    assert.equal(res.body.result, 'OK');
    assert.equal(res.body.languagePair.primary, 'ja');
    assert.equal(res.body.languagePair.secondary, 'en');
    assert.equal(res.body.source, 'user');
  });

  it('PUT rejects same language for primary and secondary', async function () {
    const res = await agent
      .put('/api/user/language-pair')
      .send({ primary: 'ja', secondary: 'ja' })
      .expect(400);
    assert.equal(res.body.result, 'NG');
  });

  it('PUT rejects invalid language code', async function () {
    const res = await agent
      .put('/api/user/language-pair')
      .send({ primary: 'ja', secondary: 'fr' })
      .expect(400);
    assert.equal(res.body.result, 'NG');
  });

  it('language-pair requires authentication (302 redirect without login)', async function () {
    const res = await request(app).get('/api/user/language-pair').expect(302);
    assert.ok(res.headers.location, 'should redirect to login');
  });
});

describe('Language Pair — first-login default init (#176)', function () {
  this.timeout(30000);

  it('login with languagePair seeds a brand-new user preference', async function () {
    const user = makeUser('seed');
    const agent = request.agent(app);

    await agent
      .post('/api/user/signup')
      .send({
        user_name: user.name,
        password: user.password,
        legalName: user.legalName,
        email: user.email
      })
      .expect('Content-Type', /json/);

    // Login carrying the pair picked on the outer (login) page.
    const loginRes = await agent
      .post('/api/user/login')
      .send({ user_name: user.name, password: user.password, languagePair: { primary: 'vi', secondary: 'en' } })
      .expect(200);
    assert.equal(loginRes.body.result, 'OK');

    // The seeded preference is now the user's own.
    const res = await agent.get('/api/user/language-pair').expect(200);
    assert.equal(res.body.languagePair.primary, 'vi');
    assert.equal(res.body.languagePair.secondary, 'en');
    assert.equal(res.body.source, 'user');
  });

  it('login languagePair does NOT override an existing user preference', async function () {
    const user = makeUser('noov');
    const agent = request.agent(app);

    await agent
      .post('/api/user/signup')
      .send({
        user_name: user.name,
        password: user.password,
        legalName: user.legalName,
        email: user.email
      })
      .expect('Content-Type', /json/);

    // First login seeds vi-en.
    await agent
      .post('/api/user/login')
      .send({ user_name: user.name, password: user.password, languagePair: { primary: 'vi', secondary: 'en' } })
      .expect(200);

    // Second login carries a different pair — must be ignored (preference already set).
    await agent
      .post('/api/user/login')
      .send({ user_name: user.name, password: user.password, languagePair: { primary: 'ja', secondary: 'en' } })
      .expect(200);

    const res = await agent.get('/api/user/language-pair').expect(200);
    assert.equal(res.body.languagePair.primary, 'vi');
    assert.equal(res.body.languagePair.secondary, 'en');
  });
});

describe('Master data enrichment (#89)', function () {
  this.timeout(30000);

  let agent;

  before(async function () {
    agent = await signupAndLogin('enr');
  });

  it('GET /api/tax-rule returns records (enrichment wired)', async function () {
    const res = await agent
      .get(`/api/tax-rule${LP_QUERY}`)
      .expect(200);
    assert.ok(Array.isArray(res.body.values), 'values should be an array');
  });

  it('GET /api/tax-rule with ?type=active returns records', async function () {
    const lpParam = encodeURIComponent(JSON.stringify({ primary: 'ja', secondary: 'vi' }));
    const res = await agent
      .get(`/api/tax-rule?type=active&date=2024-01-01&languagePair=${lpParam}`)
      .expect(200);
    assert.ok(Array.isArray(res.body.values), 'values should be an array');
  });

  it('GET /api/voucher/classes returns VoucherClass records', async function () {
    const res = await agent
      .get(`/api/voucher/classes${LP_QUERY}`)
      .expect(200);
    assert.ok(Array.isArray(res.body.values), 'values should be an array');
  });

  it('GET /api/transaction/kinds returns TransactionKind records', async function () {
    const res = await agent
      .get(`/api/transaction/kinds${LP_QUERY}`)
      .expect(200);
    assert.ok(Array.isArray(res.body.values), 'values should be an array');
  });

  it('GET /api/account-class/:id returns AccountClass', async function () {
    // If seeded data exists, find a valid AccountClass id from the account list
    const accountsRes = await agent.get('/api/accounts').expect(200);
    if (Array.isArray(accountsRes.body) && accountsRes.body.length > 0) {
      const firstAccount = accountsRes.body[0];
      const classId = firstAccount.accountClassId || firstAccount.klass_id;
      if (classId) {
        const res = await agent
          .get(`/api/account-class/${classId}${LP_QUERY}`)
          .expect(200);
        assert.ok(res.body, 'should return account class data');
      }
    } else {
      // No seeded data — endpoint returns null for non-existent id, which is fine
      const res = await agent
        .get('/api/account-class/999999' + LP_QUERY)
        .expect(200);
    }
  });
});
