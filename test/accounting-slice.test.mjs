/**
 * Integration tests — Issue #9: Tenantize accounting slice
 *
 * Tests that FiscalYear (and by extension, AccountClass/Account seeded at setup)
 * are tenant-isolated: Tenant A's setup does not bleed into Tenant B's count,
 * and each tenant can only see its own data.
 *
 * Run with: npm test
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';

const RUN = Date.now().toString(36);
const USER_C = { name: `test-c-${RUN}`, password: 'password-c' };
const USER_D = { name: `test-d-${RUN}`, password: 'password-d' };

async function signupAndLogin(user) {
  const agent = request.agent(app);
  const signupRes = await agent
    .post('/api/user/signup')
    .send({ user_name: user.name, password: user.password })
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

describe('Accounting slice — multi-tenant isolation (Issue #9)', function () {
  this.timeout(30000);

  let agentC, agentD;
  let tenantCId, tenantDId;

  const setupBody = {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    term: 1,
    year: 2026,
    companyClass: 0,
    roundingMethod: 0,
  };

  before(async function () {
    agentC = await signupAndLogin(USER_C);
    agentD = await signupAndLogin(USER_D);

    // Resolve tenant IDs from DB for direct checks
    const userC = await models.User.findOne({ where: { name: USER_C.name } });
    const userD = await models.User.findOne({ where: { name: USER_D.name } });
    const utC = await models.UserTenant.findOne({ where: { userId: userC.id, isDefault: true } });
    const utD = await models.UserTenant.findOne({ where: { userId: userD.id, isDefault: true } });
    tenantCId = utC.tenantId;
    tenantDId = utD.tenantId;
  });

  it('POST /api/setup — Tenant C can run setup', async function () {
    const res = await agentC.post('/api/setup').send(setupBody).expect(200);
    assert.equal(res.body.code, 0, `setup failed for Tenant C: ${JSON.stringify(res.body)}`);
  });

  it('POST /api/setup — Tenant C cannot run setup twice', async function () {
    const res = await agentC.post('/api/setup').send(setupBody).expect(200);
    assert.equal(res.body.code, -1, 'Expected code -1 (already exists) for second setup attempt');
  });

  it('POST /api/setup — Tenant D can run setup independently', async function () {
    const res = await agentD.post('/api/setup').send(setupBody).expect(200);
    assert.equal(res.body.code, 0, `setup failed for Tenant D: ${JSON.stringify(res.body)}`);
  });

  it('FiscalYear rows are tenant-isolated in DB', async function () {
    const fyC = await models.FiscalYear.findAll({ where: { tenantId: tenantCId } });
    const fyD = await models.FiscalYear.findAll({ where: { tenantId: tenantDId } });
    assert.equal(fyC.length, 1, 'Tenant C should have exactly 1 FiscalYear');
    assert.equal(fyD.length, 1, 'Tenant D should have exactly 1 FiscalYear');
    assert.notEqual(fyC[0].id, fyD[0].id, 'FiscalYear IDs must differ between tenants');
  });

  it('AccountClass rows are tenant-isolated in DB', async function () {
    const aclC = await models.AccountClass.findAll({ where: { tenantId: tenantCId } });
    const aclD = await models.AccountClass.findAll({ where: { tenantId: tenantDId } });
    assert.ok(aclC.length > 0, 'Tenant C should have AccountClass rows');
    assert.ok(aclD.length > 0, 'Tenant D should have AccountClass rows');
    const idsC = new Set(aclC.map(r => r.id));
    const idsD = new Set(aclD.map(r => r.id));
    const overlap = [...idsC].filter(id => idsD.has(id));
    assert.equal(overlap.length, 0, 'AccountClass rows must not overlap between tenants');
  });

  it('Account rows are tenant-isolated in DB', async function () {
    const accC = await models.Account.findAll({ where: { tenantId: tenantCId } });
    const accD = await models.Account.findAll({ where: { tenantId: tenantDId } });
    assert.ok(accC.length > 0, 'Tenant C should have Account rows');
    assert.ok(accD.length > 0, 'Tenant D should have Account rows');
    const idsC = new Set(accC.map(r => r.id));
    const idsD = new Set(accD.map(r => r.id));
    const overlap = [...idsC].filter(id => idsD.has(id));
    assert.equal(overlap.length, 0, 'Account rows must not overlap between tenants');
  });
});
