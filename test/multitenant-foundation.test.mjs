import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';

const RUN = Date.now().toString(36);
let USER_SEQ = 0;

function makeUser(tag) {
  const compactTag = String(tag).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 6) || 'u';
  const compactRun = RUN.slice(-4);
  const serial = (USER_SEQ++).toString(36).padStart(2, '0');
  const name = `u_${compactTag}_${compactRun}${serial}`.slice(0, 20);

  return {
    name,
    password: 'password-1234',
    legalName: `MT ${tag}`,
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

  const dbUser = await models.User.findOne({ where: { name: user.name } });
  assert.ok(dbUser, `db user not found: ${user.name}`);

  return { agent, user, dbUser };
}

async function getTenants(agent) {
  const res = await agent.get('/api/user/tenants').expect(200);
  assert.equal(res.body.result, 'OK');
  return res.body;
}

async function setMembership(where, patch) {
  const membership = await models.TenantMember.findOne({ where });
  assert.ok(membership, `membership not found: ${JSON.stringify(where)}`);
  for (const [key, value] of Object.entries(patch)) {
    membership[key] = value;
  }
  await membership.save();
}

async function setAllMemberships(where, patch) {
  const memberships = await models.TenantMember.findAll({ where });
  for (const membership of memberships) {
    await setMembership({ id: membership.id }, patch);
  }
}

describe('Integration — 3-layer auth and tenant switching (Issue #85)', function () {
  this.timeout(60000);

  it('1) unauthenticated user is redirected to /login', async function () {
    const res = await request(app).get('/home').expect(302);
    assert.equal(res.headers.location, '/login');
  });

  it('2) authenticated user with no active tenant is redirected to /logon', async function () {
    const { agent, dbUser } = await signupAndLogin('tenantless-screen');

    await setAllMemberships(
      { userId: dbUser.id },
      { status: 'inactive', isDefault: false }
    );

    const screenRes = await agent.get('/home').expect(302);
    assert.equal(screenRes.headers.location, '/logon');

    const userRes = await agent.get('/api/user').expect(200);
    assert.equal(userRes.body.user.id, dbUser.id);
  });

  it('3) authenticated user with one valid tenant auto-enters tenant scope', async function () {
    const { agent } = await signupAndLogin('one-tenant');

    const tenantsState = await getTenants(agent);
    assert.ok(tenantsState.activeTenantId, 'activeTenantId should be set');
    assert.ok(tenantsState.tenants.length >= 1);
  });

  it('4) authenticated + many tenants + no current/default tenant goes to /logon', async function () {
    const { agent, dbUser } = await signupAndLogin('many-no-current');

    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: `Extra-${RUN}` })
      .expect(200);
    assert.equal(createRes.body.result, 'OK');

    await setAllMemberships(
      { userId: dbUser.id, status: 'active' },
      { isDefault: false }
    );

    const logoffRes = await agent.post('/api/user/logoff').expect(200);
    assert.equal(logoffRes.body.result, 'OK');
    assert.equal(logoffRes.body.action, 'select');

    const screenRes = await agent.get('/home').expect(302);
    assert.equal(screenRes.headers.location, '/logon');

    const apiRes = await agent.get('/api/company/info').expect(403);
    assert.equal(apiRes.body.code, 'TENANT_SELECTION_REQUIRED');
    assert.equal(apiRes.body.redirectTo, '/logon');
  });

  it('5) stale session tenant falls back to valid default tenant', async function () {
    const { agent, dbUser } = await signupAndLogin('stale-fallback');

    const before = await getTenants(agent);
    const oldTenantId = before.activeTenantId;
    assert.ok(oldTenantId, 'old tenant should exist');

    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: `Fallback-${RUN}` })
      .expect(200);
    assert.equal(createRes.body.result, 'OK');
    const fallbackTenantId = createRes.body.tenant.id;

    await setAllMemberships(
      { userId: dbUser.id, status: 'active' },
      { isDefault: false }
    );
    await setMembership(
      { userId: dbUser.id, tenantId: fallbackTenantId, status: 'active' },
      { isDefault: true }
    );
    await setMembership(
      { userId: dbUser.id, tenantId: oldTenantId },
      { status: 'inactive', isDefault: false }
    );

    await agent.get('/home').expect(302);

    const after = await getTenants(agent);
    assert.equal(after.activeTenantId, fallbackTenantId);
  });

  it('6) explicit tenant selection sets active tenant and enters tenant scope', async function () {
    const { agent, dbUser } = await signupAndLogin('select-tenant');

    const before = await getTenants(agent);
    const firstTenantId = before.activeTenantId;

    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: `Select-${RUN}` })
      .expect(200);
    const secondTenantId = createRes.body.tenant.id;

    await setAllMemberships(
      { userId: dbUser.id, status: 'active' },
      { isDefault: false }
    );

    const logoffRes = await agent.post('/api/user/logoff').expect(200);
    assert.equal(logoffRes.body.action, 'select');

    const selectRes = await agent
      .post('/api/user/select-tenant')
      .send({ tenantId: secondTenantId })
      .expect(200);
    assert.equal(selectRes.body.result, 'OK');
    assert.equal(selectRes.body.tenantId, secondTenantId);

    const tenantsState = await getTenants(agent);
    assert.equal(tenantsState.activeTenantId, secondTenantId);

    const homeRes = await agent.get('/home').expect(302);
    assert.notEqual(homeRes.headers.location, '/logon');
    assert.notEqual(tenantsState.activeTenantId, firstTenantId);
  });

  it('7) tenant switch keeps data isolated to current tenant context', async function () {
    const { agent } = await signupAndLogin('switch-context');

    const before = await getTenants(agent);
    const tenantA = before.activeTenantId;

    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: `Switch-${RUN}` })
      .expect(200);
    const tenantB = createRes.body.tenant.id;

    await agent
      .put('/api/company/info')
      .send({ companyName: `Company-A-${RUN}`, roundingMethod: 0 })
      .expect(200);

    await agent
      .post('/api/user/select-tenant')
      .send({ tenantId: tenantB })
      .expect(200);

    await agent
      .put('/api/company/info')
      .send({ companyName: `Company-B-${RUN}`, roundingMethod: 1 })
      .expect(200);

    const infoB = await agent.get('/api/company/info').expect(200);
    assert.equal(infoB.body.company.companyName, `Company-B-${RUN}`);

    await agent
      .post('/api/user/select-tenant')
      .send({ tenantId: tenantA })
      .expect(200);

    const infoA = await agent.get('/api/company/info').expect(200);
    assert.equal(infoA.body.company.companyName, `Company-A-${RUN}`);
  });

  it('8) user-scope tenant APIs work without an active tenant', async function () {
    const { agent, dbUser } = await signupAndLogin('tenant-crud-no-active');

    await setAllMemberships(
      { userId: dbUser.id },
      { status: 'inactive', isDefault: false }
    );

    const listBefore = await agent.get('/api/user/tenants').expect(200);
    assert.equal(listBefore.body.result, 'OK');
    assert.equal(listBefore.body.tenants.length, 0);

    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: `Manage-${RUN}` })
      .expect(200);
    assert.equal(createRes.body.result, 'OK');

    const newTenantId = createRes.body.tenant.id;
    const updateRes = await agent
      .put(`/api/user/tenant/${newTenantId}`)
      .send({ name: `Manage-Updated-${RUN}` })
      .expect(200);
    assert.equal(updateRes.body.result, 'OK');

    const listAfter = await agent.get('/api/user/tenants').expect(200);
    assert.equal(listAfter.body.result, 'OK');
    assert.ok(listAfter.body.tenants.some(t => t.tenantId === newTenantId));
  });

  it('9) tenant-scoped API rejects access with no active tenant', async function () {
    const { agent, dbUser } = await signupAndLogin('tenantless-api');

    await setAllMemberships(
      { userId: dbUser.id },
      { status: 'inactive', isDefault: false }
    );

    const res = await agent.get('/api/company/info').expect(403);
    assert.equal(res.body.result, 'NG');
    assert.equal(res.body.code, 'TENANT_SELECTION_REQUIRED');
    assert.equal(res.body.redirectTo, '/logon');
  });

  it('10) cross-tenant selection is blocked', async function () {
    const { agent: agentA } = await signupAndLogin('cross-a');
    const { agent: agentB } = await signupAndLogin('cross-b');

    const tenantsB = await getTenants(agentB);
    const tenantB = tenantsB.activeTenantId;

    const res = await agentA
      .post('/api/user/select-tenant')
      .send({ tenantId: tenantB })
      .expect(403);

    assert.equal(res.body.result, 'NG');
  });
});
