import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import { hashPassword, resolveTenant } from '../src/lib/server/auth/index.js';
import { bootstrapTenantMember } from '../src/lib/server/auth/bootstrap.js';
import { executeSetupWizard } from '../src/lib/server/accounting/setup.js';

describe('Phase 2: Tenant Setup Wizard & Multi-Tenant Lifecycle Verification', () => {
  it('1. Phase 1 Bootstrap -> Phase 2 Setup Wizard Flow', async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `setup_test_${Date.now()}`;
      const user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('testpass'),
          email: `${username}@example.com`,
          legalName: 'Setup Test User',
          status: 'active'
        },
        { transaction: t }
      );

      // Phase 1: Bootstrap shell
      const { tenant } = await bootstrapTenantMember(user, { name: 'Setup Wizard Tenant' }, t);
      await t.commit(); // Commit Phase 1

      // Verify Invariant: FiscalYear count is 0
      const initialFyCount = await models.FiscalYear.count({ where: { tenantId: tenant.id } });
      expect(initialFyCount).to.equal(0);

      // Phase 2: Execute Setup Wizard
      const result = await executeSetupWizard(tenant.id, {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        term: 1,
        year: 2026,
        companyClass: 1, // 法人
        roundingMethod: 1 // 切り捨て
      });

      expect(result.success).to.be.true;
      expect(result.code).to.equal(0);

      // Verify Invariant: FiscalYear count is now > 0
      const postFyCount = await models.FiscalYear.count({ where: { tenantId: tenant.id } });
      expect(postFyCount).to.equal(1);

      // Verify Account Classes & Accounts created
      const accountClasses = await models.AccountClass.findAll({ where: { tenantId: tenant.id } });
      expect(accountClasses.length).to.be.greaterThan(0);

      const accounts = await models.Account.findAll({ where: { tenantId: tenant.id } });
      expect(accounts.length).to.be.greaterThan(20);

      const accountRemainings = await models.AccountRemaining.findAll({ where: { tenantId: tenant.id } });
      expect(accountRemainings.length).to.equal(accounts.length);

      // Verify Menu templates created
      const menus = await models.Menu.findAll({ where: { tenantId: tenant.id } });
      expect(menus.length).to.be.greaterThan(0);

      // Verify Tenant Settings updated
      const updatedTenant = await models.Tenant.findByPk(tenant.id);
      expect(updatedTenant.settings?.roundingMethod).to.equal(1);

      // Clean up test data
      await models.AccountRemaining.destroy({ where: { tenantId: tenant.id } });
      await models.SubAccountRemaining.destroy({ where: { tenantId: tenant.id } });
      await models.SubAccount.destroy({ where: { tenantId: tenant.id } });
      await models.Account.destroy({ where: { tenantId: tenant.id } });
      await models.AccountClass.destroy({ where: { tenantId: tenant.id } });
      await models.Menu.destroy({ where: { tenantId: tenant.id } });
      await models.FiscalYear.destroy({ where: { tenantId: tenant.id } });
      await models.Company.destroy({ where: { tenantId: tenant.id } });
      await models.CompanyClass.destroy({ where: { tenantId: tenant.id } });
      await models.TenantMember.destroy({ where: { tenantId: tenant.id } });
      await models.Tenant.destroy({ where: { id: tenant.id } });
      await models.User.destroy({ where: { id: user.id } });
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
  });

  it('2. Multi-tenant Switching and Resolution', async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `multi_tenant_${Date.now()}`;
      const user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('testpass'),
          email: `${username}@example.com`,
          legalName: 'Multi Tenant User',
          status: 'active'
        },
        { transaction: t }
      );

      const res1 = await bootstrapTenantMember(user, { name: 'Tenant Alpha' }, t);
      const res2 = await bootstrapTenantMember(user, { name: 'Tenant Beta' }, t);
      await t.commit();

      const tenant1 = res1.tenant;
      const tenant2 = res2.tenant;

      // Resolve with explicit tenant 1
      const m1 = await resolveTenant(user.id, tenant1.id);
      expect(m1.tenantId).to.equal(tenant1.id);

      // Resolve with explicit tenant 2
      const m2 = await resolveTenant(user.id, tenant2.id);
      expect(m2.tenantId).to.equal(tenant2.id);

      // Clean up
      await models.Company.destroy({ where: { tenantId: [tenant1.id, tenant2.id] } });
      await models.CompanyClass.destroy({ where: { tenantId: [tenant1.id, tenant2.id] } });
      await models.TenantMember.destroy({ where: { tenantId: [tenant1.id, tenant2.id] } });
      await models.Tenant.destroy({ where: { id: [tenant1.id, tenant2.id] } });
      await models.User.destroy({ where: { id: user.id } });
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
  });
});
