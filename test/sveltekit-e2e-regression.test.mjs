import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import { hashPassword, resolveTenant } from '../src/lib/server/auth/index.js';
import { bootstrapTenantMember } from '../src/lib/server/auth/bootstrap.js';
import { executeSetupWizard } from '../src/lib/server/accounting/setup.js';
import { createCrossSlip } from '../src/lib/server/accounting/crossSlip.js';
import { getAccountLedger } from '../src/lib/server/accounting/ledger.js';
import { calculateTrialBalance } from '../src/lib/server/accounting/trialBalance.js';

describe('Phase 5: Full End-to-End Multi-Tenant Lifecycle Regression Suite', () => {
  let user, tenant, cashAccount, salesAccount;

  it('Step 1: User Signup & Phase 1 Tenant Shell Bootstrap', async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `e2e_user_${Date.now()}`;
      user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('supersecret123'),
          email: `${username}@finacc.example.com`,
          legalName: 'E2E Test Enterprise Inc.',
          status: 'active'
        },
        { transaction: t }
      );

      const res = await bootstrapTenantMember(user, { name: 'E2E Enterprise Tokyo' }, t);
      tenant = res.tenant;
      await t.commit();

      expect(user.id).to.exist;
      expect(tenant.id).to.exist;

      // Invariant: FiscalYear count is 0 before Phase 2 setup
      const initialFyCount = await models.FiscalYear.count({ where: { tenantId: tenant.id } });
      expect(initialFyCount).to.equal(0);
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
  });

  it('Step 2: Tenant Membership & 4-Step Resolution Chain', async () => {
    const resolved = await resolveTenant(user.id, tenant.id);
    expect(resolved).to.exist;
    expect(resolved.tenantId).to.equal(tenant.id);
    expect(resolved.isOwner).to.be.true;
    expect(resolved.status).to.equal('active');
  });

  it('Step 3: Phase 2 Accounting Setup Wizard Execution', async () => {
    const result = await executeSetupWizard(tenant.id, {
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      term: 1,
      year: 2026,
      companyClass: 1,
      roundingMethod: 1
    });

    expect(result.success).to.be.true;
    expect(result.code).to.equal(0);

    const postFyCount = await models.FiscalYear.count({ where: { tenantId: tenant.id } });
    expect(postFyCount).to.equal(1);

    const accounts = await models.Account.findAll({ where: { tenantId: tenant.id } });
    expect(accounts.length).to.be.greaterThan(20);

    cashAccount = accounts.find((a) => a.accountCode === '1111') || accounts[0];
    salesAccount = accounts.find((a) => a.accountCode === '7111') || accounts[accounts.length - 1];
  });

  it('Step 4: Phase 3 Double-Entry Transfer Slip Posting', async () => {
    const slip = await createCrossSlip(
      {
        year: 2026,
        month: 6,
        day: 20,
        memo: 'E2E Consulting Services Billed & Paid in Cash',
        lines: [
          {
            debitAccount: cashAccount.id,
            creditAccount: salesAccount.id,
            debitAmount: 250000,
            creditAmount: 250000,
            application1: 'Q2 Consulting Fee'
          }
        ]
      },
      { id: user.id, approvable: true },
      tenant.id
    );

    expect(slip).to.exist;
    expect(slip.no).to.equal(1);
    expect(slip.term).to.equal(1);

    const details = await models.CrossSlipDetail.findAll({
      where: { crossSlipId: slip.id, tenantId: tenant.id }
    });
    expect(details.length).to.equal(1);
    expect(parseFloat(details[0].debitAmount)).to.equal(250000);
    expect(parseFloat(details[0].creditAmount)).to.equal(250000);
  });

  it('Step 5: General Ledger & Trial Balance v2 Mathematical Consistency', async () => {
    const cashLedger = await getAccountLedger(tenant.id, 1, cashAccount.accountCode);
    expect(cashLedger.lines.length).to.equal(1);
    expect(cashLedger.summary.debitSum).to.equal(250000);
    expect(cashLedger.summary.balance).to.equal(250000);

    const tb = await calculateTrialBalance(tenant.id, 1);
    expect(tb.totals.debit).to.equal(250000);
    expect(tb.totals.credit).to.equal(250000);
    expect(tb.totals.isBalanced).to.be.true;
  });

  after(async () => {
    if (tenant && user) {
      await models.CrossSlipDetail.destroy({ where: { tenantId: tenant.id } });
      await models.CrossSlip.destroy({ where: { tenantId: tenant.id } });
      await models.AccountRemaining.destroy({ where: { tenantId: tenant.id } });
      await models.SubAccountRemaining.destroy({ where: { tenantId: tenant.id } });
      await models.SubAccount.destroy({ where: { tenantId: tenant.id } });
      await models.Account.destroy({ where: { tenantId: tenant.id } });
      await models.AccountClass.destroy({ where: { tenantId: tenant.id } });
      await models.Menu.destroy({ where: { tenantId: tenant.id } });
      await models.FiscalYear.destroy({ where: { tenantId: tenant.id } });
      await models.MonthlyLog.destroy({ where: { tenantId: tenant.id } });
      await models.Company.destroy({ where: { tenantId: tenant.id } });
      await models.CompanyClass.destroy({ where: { tenantId: tenant.id } });
      await models.TenantMember.destroy({ where: { tenantId: tenant.id } });
      await models.Tenant.destroy({ where: { id: tenant.id } });
      await models.User.destroy({ where: { id: user.id } });
    }
  });
});
