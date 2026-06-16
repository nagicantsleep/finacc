/**
 * Issue #333 — seedTenantBase DRY and slug race hardening.
 *
 * Tests:
 *  1. slugFromName produces different slugs on successive calls (entropy).
 *  2. seedTenantBase creates Tenant, TenantMember(owner), 8 CompanyClass, 1 Company ("本社") for both default and non-default.
 *  3. bootstrapTenantMember is idempotent (second call returns existing, no duplicates).
 *  4. Duplicate slug yields 409 (not 500) through the createTenant route.
 */
import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';
import { slugFromName } from '../libs/bootstrap.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

let SEQ = 0;
const RUN = Date.now().toString(36);

function freshUser(tag) {
  SEQ += 1;
  const name = `seedtest_${tag}_${RUN.slice(-4)}${SEQ.toString(36)}`.slice(0, 20);
  return {
    name,
    password: 'password-1234',
    legalName: `Seed Test ${tag} ${RUN}`,
    email: `${name}@example.com`,
  };
}

function freshTenantName(tag) {
  return `${tag} ${RUN}`;
}

async function signupAndLogin(user) {
  const agent = request.agent(app);
  await agent.post('/api/user/signup').send({
    user_name: user.name,
    password: user.password,
    legalName: user.legalName,
    email: user.email,
  });
  await agent.post('/api/user/login').send({
    user_name: user.name,
    password: user.password,
  });
  return agent;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('slugFromName entropy', () => {
  it('produces different slugs on successive calls', () => {
    const s1 = slugFromName('tanaka');
    const s2 = slugFromName('tanaka');
    assert.notEqual(s1, s2, 'two calls to slugFromName with the same input should produce different slugs');
  });

  it('preserves the base name prefix', () => {
    const slug = slugFromName('yamada');
    assert.ok(slug.startsWith('yamada-'), `slug "${slug}" should start with "yamada-"`);
  });

  it('handles empty / special-character input', () => {
    const slug = slugFromName('!!!');
    assert.ok(slug.startsWith('user-'), `slug "${slug}" should start with "user-" for special chars`);
  });
});

describe('seedTenantBase — tenant shell creation', () => {
  it('default tenant: creates Tenant, TenantMember(owner), 8 CompanyClass, 1 Company', async () => {
    const user = freshUser('seeddef');
    const agent = await signupAndLogin(user);

    // Bootstrap already ran during signup. Verify via the API session.
    const sessRes = await agent.get('/api/user/session-status').expect(200);
    assert.equal(sessRes.body.result, 'OK');
    assert.ok(sessRes.body.activeTenantId, 'session should have activeTenantId');

    // Verify DB: user has exactly one default TenantMember.
    const membership = await models.TenantMember.findOne({
      where: { userId: sessRes.body.user.id, isDefault: true },
    });
    assert.ok(membership, 'should have a default TenantMember');
    assert.equal(membership.isOwner, true);

    const tenant = await models.Tenant.findByPk(membership.tenantId);
    assert.ok(tenant, 'tenant should exist');
    assert.equal(tenant.status, 'active');

    // 8 CompanyClass seeded
    const companyClasses = await models.CompanyClass.findAll({
      where: { tenantId: tenant.id },
    });
    assert.equal(companyClasses.length, 8, `expected 8 CompanyClasses, got ${companyClasses.length}`);

    // 1 Company named "本社"
    const companies = await models.Company.findAll({
      where: { tenantId: tenant.id, name: '本社' },
    });
    assert.equal(companies.length, 1, `expected 1 Company "本社", got ${companies.length}`);
  });

  it('additional tenant: creates Tenant, TenantMember(owner), 8 CompanyClass, 1 Company', async () => {
    const user = freshUser('seedadd');
    const agent = await signupAndLogin(user);

    // Get user ID from session-status
    const sessRes = await agent.get('/api/user/session-status').expect(200);
    assert.equal(sessRes.body.result, 'OK');
    const userId = sessRes.body.user.id;

    // Create an additional (non-default) tenant via the API
    const createRes = await agent
      .post('/api/user/tenant')
      .send({ name: freshTenantName('テスト会社') })
      .expect(200);
    assert.equal(createRes.body.result, 'OK');
    const tenantId = createRes.body.tenant.id;

    // Verify TenantMember(owner) for the new tenant
    const membership = await models.TenantMember.findOne({
      where: { userId, tenantId, isOwner: true },
    });
    assert.ok(membership, 'should have owner TenantMember for additional tenant');
    assert.equal(membership.isDefault, false, 'additional tenant should not be default');

    // 8 CompanyClass
    const companyClasses = await models.CompanyClass.findAll({ where: { tenantId } });
    assert.equal(companyClasses.length, 8, `expected 8 CompanyClasses, got ${companyClasses.length}`);

    // 1 Company "本社"
    const companies = await models.Company.findAll({ where: { tenantId, name: '本社' } });
    assert.equal(companies.length, 1, `expected 1 Company "本社", got ${companies.length}`);
  });
});

describe('bootstrapTenantMember idempotency', () => {
  it('calling signup twice for the same user does not create duplicate tenants', async () => {
    const user = freshUser('idempot');
    const agent = request.agent(app);

    // First signup
    await agent.post('/api/user/signup').send({
      user_name: user.name,
      password: user.password,
      legalName: user.legalName,
      email: user.email,
    });
    await agent.post('/api/user/login').send({
      user_name: user.name,
      password: user.password,
    });

    // Get user ID from session-status
    const sessRes1 = await agent.get('/api/user/session-status').expect(200);
    const userId = sessRes1.body.user.id;

    // Second signup with same username (returns "既に登録")
    await agent.post('/api/user/signup').send({
      user_name: user.name,
      password: user.password,
      legalName: user.legalName,
      email: user.email,
    });

    // Login again (triggers bootstrapTenantMember again)
    await agent.post('/api/user/login').send({
      user_name: user.name,
      password: user.password,
    });

    // Should still have exactly one default TenantMember
    const memberships = await models.TenantMember.findAll({
      where: { userId, isDefault: true },
    });
    assert.equal(memberships.length, 1, `expected 1 default membership, got ${memberships.length}`);
  });
});

describe('slug race — 409 on duplicate', () => {
  it('duplicate slug returns 409 with Japanese message, not 500', async () => {
    const user1 = freshUser('race1');
    const user2 = freshUser('race2');
    const agent1 = await signupAndLogin(user1);
    const agent2 = await signupAndLogin(user2);

    // Create a tenant with a specific slug via agent1
    const createRes = await agent1
      .post('/api/user/tenant')
      .send({ name: freshTenantName('重複テスト'), slug: `dup-slug-${RUN}` })
      .expect(200);
    assert.equal(createRes.body.result, 'OK');

    // Try to create a tenant with the same slug via agent2
    const dupRes = await agent2
      .post('/api/user/tenant')
      .send({ name: freshTenantName('重複テスト2'), slug: `dup-slug-${RUN}` })
      .expect(409);
    assert.equal(dupRes.body.result, 'NG');
    assert.ok(dupRes.body.message.includes('使用'), `error message should mention "使用": ${dupRes.body.message}`);
  });

  it('duplicate name returns 409, not 500', async () => {
    const user1 = freshUser('rname1');
    const user2 = freshUser('rname2');
    const agent1 = await signupAndLogin(user1);
    const agent2 = await signupAndLogin(user2);

    // Create a tenant with a specific name
    await agent1
      .post('/api/user/tenant')
      .send({ name: freshTenantName('名前重複テスト') })
      .expect(200);

    // Try to create a tenant with the same name
    const dupRes = await agent2
      .post('/api/user/tenant')
      .send({ name: freshTenantName('名前重複テスト') })
      .expect(409);
    assert.equal(dupRes.body.result, 'NG');
  });
});
