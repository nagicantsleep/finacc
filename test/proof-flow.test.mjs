/**
 * Integration tests — Issue #8: Tenantize proof flow
 *
 * Proof flow:
 *   1. Signup two independent users (each gets own tenant via bootstrap)
 *   2. Login as each user
 *   3. GET /api/user — each user sees only their own identity
 *   4. PUT /api/company/info — each tenant writes its own company settings
 *   5. GET /api/company/info — each tenant reads back only its own settings
 *   6. Cross-tenant isolation: Tenant A cannot read Tenant B's settings
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';

// Unique user names per test run to avoid collisions with existing data
const RUN = Date.now().toString(36);
const USER_A = { name: `testa_${RUN}`, password: 'password-a' };
const USER_B = { name: `testb_${RUN}`, password: 'password-b' };

/**
 * Sign up a user, returning a supertest agent that carries the session cookie.
 */
async function signupAndLogin(user) {
  const agent = request.agent(app);

  // Signup (first user gets bootstrap tenant automatically only if DB is empty;
  // for subsequent users in tests we may not get bootstrap — that's fine,
  // we only need what the current bootstrap logic provides)
  const signupRes = await agent
    .post('/api/user/signup')
    .send({ user_name: user.name, password: user.password, legalName: user.name, email: `${user.name}@example.com` })
    .expect('Content-Type', /json/);

  assert.ok(
    signupRes.body.result === 'OK' || signupRes.body.message?.includes('既に登録'),
    `signup unexpected result: ${JSON.stringify(signupRes.body)}`
  );

  // Login
  const loginRes = await agent
    .post('/api/user/login')
    .send({ user_name: user.name, password: user.password })
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(loginRes.body.result, 'OK', `login failed for ${user.name}`);

  return agent;
}

describe('Proof flow — multi-tenant isolation', function () {
  this.timeout(15000);

  let agentA, agentB;

  before(async function () {
    agentA = await signupAndLogin(USER_A);
    agentB = await signupAndLogin(USER_B);
  });

  // ------------------------------------------------------------------
  // 1. Current user endpoint — each agent sees its own identity
  // ------------------------------------------------------------------
  it('GET /api/user — Tenant A sees its own user', async function () {
    const res = await agentA.get('/api/user').expect(200);
    assert.ok(res.body.user, 'user field missing');
    assert.equal(res.body.user.name, USER_A.name, 'wrong user returned for agent A');
  });

  it('GET /api/user — Tenant B sees its own user', async function () {
    const res = await agentB.get('/api/user').expect(200);
    assert.ok(res.body.user, 'user field missing');
    assert.equal(res.body.user.name, USER_B.name, 'wrong user returned for agent B');
  });

  it('GET /api/user — Tenant A and Tenant B are different users', async function () {
    const [resA, resB] = await Promise.all([
      agentA.get('/api/user').expect(200),
      agentB.get('/api/user').expect(200),
    ]);
    assert.notEqual(
      resA.body.user.id,
      resB.body.user.id,
      'Both agents returned the same user — session isolation broken'
    );
  });

  // ------------------------------------------------------------------
  // 2. Company/settings — each tenant writes and reads its own settings
  // ------------------------------------------------------------------
  const settingsA = { companyName: `Company A ${RUN}`, roundingMethod: 0 };
  const settingsB = { companyName: `Company B ${RUN}`, roundingMethod: 1 };

  it('PUT /api/company/info — Tenant A can write its settings', async function () {
    const res = await agentA
      .put('/api/company/info')
      .send(settingsA)
      .expect(200);
    assert.equal(res.body.code, 0, 'PUT settings failed for Tenant A');
  });

  it('PUT /api/company/info — Tenant B can write its settings', async function () {
    const res = await agentB
      .put('/api/company/info')
      .send(settingsB)
      .expect(200);
    assert.equal(res.body.code, 0, 'PUT settings failed for Tenant B');
  });

  it('GET /api/company/info — Tenant A reads back its own settings', async function () {
    const res = await agentA.get('/api/company/info').expect(200);
    assert.ok(res.body.company, 'company field missing');
    assert.equal(
      res.body.company.companyName,
      settingsA.companyName,
      'Tenant A got wrong companyName'
    );
  });

  it('GET /api/company/info — Tenant B reads back its own settings', async function () {
    const res = await agentB.get('/api/company/info').expect(200);
    assert.ok(res.body.company, 'company field missing');
    assert.equal(
      res.body.company.companyName,
      settingsB.companyName,
      'Tenant B got wrong companyName'
    );
  });

  // ------------------------------------------------------------------
  // 3. Cross-tenant isolation — Tenant A cannot see Tenant B's settings
  // ------------------------------------------------------------------
  it('Cross-tenant isolation — Tenant A does not see Tenant B settings', async function () {
    const [resA, resB] = await Promise.all([
      agentA.get('/api/company/info').expect(200),
      agentB.get('/api/company/info').expect(200),
    ]);
    assert.notEqual(
      resA.body.company?.companyName,
      resB.body.company?.companyName,
      'Tenant A and Tenant B returned the same companyName — tenant isolation broken'
    );
  });
});
