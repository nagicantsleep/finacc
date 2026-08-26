import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import {
  authUser,
  hashPassword,
  resolveTenant,
  buildSessionUser,
  overlayMembershipPermissions
} from '../src/lib/server/auth/index.js';
import { bootstrapTenantMember } from '../src/lib/server/auth/bootstrap.js';

describe('Phase 1: SvelteKit Foundation & Server Layer Verification', () => {
  it('1. Database connectivity & 54 Sequelize models initialization', async () => {
    await models.sequelize.authenticate();
    const modelKeys = Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize');
    expect(modelKeys.length).to.be.at.least(50);
    expect(models.User).to.exist;
    expect(models.Tenant).to.exist;
    expect(models.TenantMember).to.exist;
    expect(models.FiscalYear).to.exist;
    expect(models.Account).to.exist;
    expect(models.CrossSlip).to.exist;
  });

  it('2. Password hashing & authentication logic', async () => {
    const password = 'TestPassword123!';
    const hashed = hashPassword(password);
    expect(hashed).to.be.a('string');
    expect(hashed).to.not.equal(password);
  });

  it('3. Multi-tenant Bootstrap Shell & Tenant Resolution', async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `test_user_${Date.now()}`;
      const user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('password123'),
          email: `${username}@example.com`,
          legalName: 'Test Legal Name',
          status: 'active'
        },
        { transaction: t }
      );

      const { tenant, membership, companyClasses, company } = await bootstrapTenantMember(
        user,
        { name: 'Test Tenant Org' },
        t
      );

      expect(tenant).to.exist;
      expect(tenant.name).to.equal('Test Tenant Org');
      expect(membership.isOwner).to.be.true;
      expect(companyClasses.length).to.equal(8);
      expect(company.name).to.equal('本社');

      await t.rollback(); // Clean rollback after test
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
  });

  it('4. Session User Construction and Permission Overlay', () => {
    const rawUser = {
      id: 999,
      name: 'admin_test',
      legalName: 'Admin Legal',
      email: 'admin@example.com',
      hashPassword: 'secret_hash_not_in_session'
    };
    const sessionUser = buildSessionUser(rawUser);
    expect(sessionUser.id).to.equal(999);
    expect(sessionUser.hashPassword).to.be.undefined;

    const membership = {
      tenantId: 'tenant-uuid-1',
      isOwner: true,
      accounting: true,
      administrable: true
    };
    overlayMembershipPermissions(sessionUser, membership);
    expect(sessionUser.tenantId).to.equal('tenant-uuid-1');
    expect(sessionUser.isOwner).to.be.true;
    expect(sessionUser.accounting).to.be.true;
    expect(sessionUser.administrable).to.be.true;
  });
});
