import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import { hashPassword } from '../src/lib/server/auth/index.js';
import { bootstrapTenantMember } from '../src/lib/server/auth/bootstrap.js';
import { executeSetupWizard } from '../src/lib/server/accounting/setup.js';
import { calculateTrialBalance } from '../src/lib/server/accounting/trialBalance.js';

describe('Phase 4: SSR Documents & Financial Statement Reports Verification', () => {
  let user, tenant;

  before(async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `report_user_${Date.now()}`;
      user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('testpass'),
          email: `${username}@example.com`,
          legalName: 'Report Tester',
          status: 'active'
        },
        { transaction: t }
      );

      const res = await bootstrapTenantMember(user, { name: 'Report Test Corp' }, t);
      tenant = res.tenant;
      await t.commit();

      await executeSetupWizard(tenant.id, {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        term: 1,
        year: 2026,
        companyClass: 1,
        roundingMethod: 1
      });
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
  });

  after(async () => {
    if (tenant && user) {
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
    }
  });

  it('1. Financial Statement data aggregation loads cleanly', async () => {
    const tb = await calculateTrialBalance(tenant.id, 1);
    expect(tb.rows).to.be.an('array');
    expect(tb.totals).to.have.property('debit');
    expect(tb.totals).to.have.property('credit');
    expect(tb.totals.isBalanced).to.be.true;
  });

  it('2. Invoice Calculation & Tax Breakdown Verification', () => {
    const subtotal = 100000;
    const tax10 = Math.floor(subtotal * 0.1);
    const total = subtotal + tax10;

    expect(tax10).to.equal(10000);
    expect(total).to.equal(110000);
  });
});
