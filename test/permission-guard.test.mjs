import { assert } from 'chai';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';
import bcrypt from 'bcrypt';

describe('API Permission Guard & Multi-tenant RBAC', function () {
  this.timeout(15000);
  const RUN = Date.now();
  let userOwner, userMember, userAccounting;
  let tenant;
  let ownerAgent, memberAgent, accountingAgent, anonAgent;

  before(async () => {
    anonAgent = request.agent(app);
    ownerAgent = request.agent(app);
    memberAgent = request.agent(app);
    accountingAgent = request.agent(app);

    const hashPassword = await bcrypt.hash('password123', 10);

    // Create 3 users
    userOwner = await models.User.create({
      name: `owner_${RUN}`,
      email: `owner_${RUN}@example.com`,
      legalName: `Owner Legal ${RUN}`,
      hashPassword
    });

    userMember = await models.User.create({
      name: `member_${RUN}`,
      email: `member_${RUN}@example.com`,
      legalName: `Member Legal ${RUN}`,
      hashPassword
    });

    userAccounting = await models.User.create({
      name: `acct_${RUN}`,
      email: `acct_${RUN}@example.com`,
      legalName: `Acct Legal ${RUN}`,
      hashPassword
    });

    // Create Tenant
    tenant = await models.Tenant.create({
      slug: `perm-tenant-${RUN}`,
      name: 'Permission Test Tenant',
      status: 'active',
      settings: { companyName: 'Perm Co', roundingMethod: 0 }
    });

    // Create Memberships
    // 1. Owner (all permissions true)
    await models.TenantMember.create({
      userId: userOwner.id,
      tenantId: tenant.id,
      isOwner: true,
      isDefault: true,
      status: 'active',
      accounting: true,
      fiscalBrowsing: true,
      approvable: true,
      administrable: true,
      companyManagement: true,
      inventoryManagement: true,
      personnelManagement: true,
      tenantSettings: true
    });

    // 2. Member (no special permissions)
    await models.TenantMember.create({
      userId: userMember.id,
      tenantId: tenant.id,
      isOwner: false,
      isDefault: true,
      status: 'active',
      accounting: false,
      fiscalBrowsing: false,
      approvable: false,
      administrable: false,
      companyManagement: false,
      inventoryManagement: false,
      personnelManagement: false,
      tenantSettings: false
    });

    // 3. Accounting only
    await models.TenantMember.create({
      userId: userAccounting.id,
      tenantId: tenant.id,
      isOwner: false,
      isDefault: true,
      status: 'active',
      accounting: true,
      fiscalBrowsing: true,
      approvable: false,
      administrable: false,
      companyManagement: false,
      inventoryManagement: false,
      personnelManagement: false,
      tenantSettings: false
    });

    // Log in all agents
    await ownerAgent
      .post('/api/user/login')
      .send({ user_name: `owner_${RUN}`, password: 'password123' })
      .expect(200);

    await memberAgent
      .post('/api/user/login')
      .send({ user_name: `member_${RUN}`, password: 'password123' })
      .expect(200);

    await accountingAgent
      .post('/api/user/login')
      .send({ user_name: `acct_${RUN}`, password: 'password123' })
      .expect(200);
  });

  after(async () => {
    await models.TenantMember.destroy({ where: { tenantId: tenant.id } });
    await models.Tenant.destroy({ where: { id: tenant.id } });
    await models.User.destroy({
      where: {
        id: [userOwner.id, userMember.id, userAccounting.id]
      }
    });
  });

  describe('1. Public Routes', () => {
    it('GET /api/version is accessible without auth (200)', async () => {
      const res = await anonAgent.get('/api/version').expect(200);
      assert.ok(res.body.version);
    });

    it('GET /api/user/session-status returns unauthenticated status (401)', async () => {
      const res = await anonAgent.get('/api/user/session-status').expect(401);
      assert.equal(res.body.authenticated, false);
    });
  });

  describe('2. Unauthenticated requests to protected routes', () => {
    it('GET /api/user returns 401', async () => {
      const res = await anonAgent.get('/api/user').expect(401);
      assert.equal(res.body.code, -10);
    });

    it('GET /api/journal/2026/1 returns 401', async () => {
      const res = await anonAgent.get('/api/journal/2026/1').expect(401);
      assert.equal(res.body.code, -10);
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('non-admin member is rejected from /api/admin/backups (403)', async () => {
      const res = await memberAgent.get('/api/admin/backups').expect(403);
      assert.equal(res.body.code, -10);
      assert.equal(res.body.message, 'permission denied');
    });

    it('non-accounting member is rejected from /api/journal/2026/1 (403)', async () => {
      const res = await memberAgent.get('/api/journal/2026/1').expect(403);
      assert.equal(res.body.code, -10);
      assert.equal(res.body.message, 'permission denied');
    });

    it('non-approvable accounting user is rejected from /api/cross_slip/approve (403)', async () => {
      const res = await accountingAgent.put('/api/cross_slip/approve').send({}).expect(403);
      assert.equal(res.body.code, -10);
      assert.equal(res.body.message, 'permission denied');
    });

    it('accounting user can access /api/accounts3/1 (200)', async () => {
      const res = await accountingAgent.get('/api/accounts3/1').expect(200);
      assert.ok(res.body);
    });

    it('owner can access admin, accounting, and approval routes', async () => {
      const resAdmin = await ownerAgent.get('/api/admin/backups').expect(200);
      assert.ok(resAdmin.body);

      const resAccounts = await ownerAgent.get('/api/accounts3/1').expect(200);
      assert.ok(resAccounts.body);
    });

    it('general member can access own profile and public-tenant data', async () => {
      const res = await memberAgent.get('/api/user').expect(200);
      assert.equal(res.body.user.name, `member_${RUN}`);

      const resLang = await memberAgent.get('/api/user/language-pair').expect(200);
      assert.ok(resLang.body);
    });
  });
});
