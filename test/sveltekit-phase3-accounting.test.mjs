import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import { hashPassword } from '../src/lib/server/auth/index.js';
import { bootstrapTenantMember } from '../src/lib/server/auth/bootstrap.js';
import { executeSetupWizard } from '../src/lib/server/accounting/setup.js';
import { createCrossSlip } from '../src/lib/server/accounting/crossSlip.js';
import { getAccountLedger } from '../src/lib/server/accounting/ledger.js';
import { calculateTrialBalance } from '../src/lib/server/accounting/trialBalance.js';

describe('Phase 3: Core Accounting Modules, Slips, Ledger & Trial Balance Verification', () => {
  let user, tenant, cashAccount, revenueAccount;

  before(async () => {
    const t = await models.sequelize.transaction();
    try {
      const username = `acct_user_${Date.now()}`;
      user = await models.User.create(
        {
          name: username,
          hashPassword: hashPassword('testpass'),
          email: `${username}@example.com`,
          legalName: 'Accounting Tester',
          status: 'active'
        },
        { transaction: t }
      );

      const res = await bootstrapTenantMember(user, { name: 'Acct Test Corp' }, t);
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

      const accounts = await models.Account.findAll({ where: { tenantId: tenant.id } });
      cashAccount = accounts.find(a => a.accountCode === 1111) || accounts[0];
      revenueAccount = accounts.find(a => a.accountCode === 7111) || accounts[accounts.length - 1];
    } catch (e) {
      if (!t.finished) await t.rollback();
      throw e;
    }
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

  it('1. Create double-entry transfer slip', async () => {
    const slip = await createCrossSlip(
      {
        year: 2026,
        month: 5,
        day: 15,
        memo: 'Sales receipt test',
        lines: [
          {
            debitAccount: cashAccount.id,
            creditAccount: revenueAccount.id,
            debitAmount: 50000,
            creditAmount: 50000,
            application1: 'Product sales revenue'
          }
        ]
      },
      { id: user.id, approvable: true },
      tenant.id
    );

    expect(slip).to.exist;
    expect(slip.no).to.equal(1);
    expect(slip.term).to.equal(1);

    const details = await models.CrossSlipDetail.findAll({ where: { crossSlipId: slip.id, tenantId: tenant.id } });
    expect(details.length).to.equal(1);
    expect(parseFloat(details[0].debitAmount)).to.equal(50000);
    expect(parseFloat(details[0].creditAmount)).to.equal(50000);
  });

  it('2. General Ledger line posting and balance calculation', async () => {
    const cashLedger = await getAccountLedger(tenant.id, 1, cashAccount.accountCode);
    expect(cashLedger.account.code).to.equal(cashAccount.accountCode);
    expect(cashLedger.lines.length).to.equal(1);
    expect(cashLedger.lines[0].debitAmount).to.equal(50000);
    expect(cashLedger.summary.debitSum).to.equal(50000);
    expect(cashLedger.summary.balance).to.equal(50000);

    const revLedger = await getAccountLedger(tenant.id, 1, revenueAccount.accountCode);
    expect(revLedger.lines.length).to.equal(1);
    expect(revLedger.lines[0].creditAmount).to.equal(50000);
    expect(revLedger.summary.creditSum).to.equal(50000);
  });

  it('3. Trial Balance v2 calculation and balanced totals verification', async () => {
    const tb = await calculateTrialBalance(tenant.id, 1);
    expect(tb.rows.length).to.be.greaterThan(0);
    expect(tb.totals.debit).to.equal(50000);
    expect(tb.totals.credit).to.equal(50000);
    expect(tb.totals.isBalanced).to.be.true;
  });

  it('4. Company Master CRUD with tenant isolation', async () => {
    const companyClass = await models.CompanyClass.findOne({ where: { tenantId: tenant.id } });
    const company = await models.Company.create({
      tenantId: tenant.id,
      code: 9999,
      name: 'Client Partner Alpha',
      officialName: 'Client Partner Alpha Co., Ltd.',
      companyClassId: companyClass.id,
      isClient: true
    });

    expect(company.id).to.exist;
    expect(company.tenantId).to.equal(tenant.id);

    const fetched = await models.Company.findOne({ where: { id: company.id, tenantId: tenant.id } });
    expect(fetched.name).to.equal('Client Partner Alpha');
  });
});
