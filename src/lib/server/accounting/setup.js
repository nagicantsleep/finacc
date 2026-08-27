import models from '../../../../models/index.js';
import parseAccounts from '../parse_accounts.js';
import { menuTemplates } from './menuTemplates.js';

export const createInitialMenuTemplates = async (tenantId, t) => {
  const records = menuTemplates.map((template, i) => ({
    tenantId,
    userId: null,
    title: template.title,
    displayOrder: i + 1,
    body: JSON.stringify(template.menu)
  }));
  await models.Menu.bulkCreate(records, { transaction: t });
};

export const createInitialAccount = async (tenantId, term, companyClass, t) => {
  const now = new Date();
  let accountClasses = [];
  const values = parseAccounts(term, companyClass);

  values.accountClasses.forEach((account_class) => {
    accountClasses.push({
      major: account_class.major,
      middle: account_class.middle,
      minor: account_class.minor,
      field: account_class.field,
      adding: account_class.adding,
      tenantId,
      createdAt: now,
      updatedAt: now
    });
  });

  await models.AccountClass.bulkCreate(accountClasses, { transaction: t });
  accountClasses = await models.AccountClass.findAll({ where: { tenantId }, transaction: t });

  for (let i = 0; i < values.accounts.length; i++) {
    let account = values.accounts[i];
    let account_class = await models.AccountClass.findOne({
      where: {
        tenantId,
        field: account.field,
        adding: account.adding
      },
      transaction: t
    });

    let account_rec = await models.Account.create(
      {
        name: account.name,
        key: account.key,
        accountClassId: account_class.id,
        accountCode: account.account_code,
        taxClass: account.tax_class,
        subAccountCount: account.sub_account_count,
        tenantId,
        createdAt: now,
        updatedAt: now
      },
      { transaction: t }
    );
    account.rec_id = account_rec.id;
  }

  for (let i = 0; i < values.accounts.length; i++) {
    let account = values.accounts[i];
    await models.AccountRemaining.create(
      {
        accountId: account.rec_id,
        term: account.term,
        debit: 0,
        credit: 0,
        balance: 0,
        tenantId
      },
      { transaction: t }
    );
  }

  if (values.subAccounts) {
    for (let i = 0; i < values.subAccounts.length; i++) {
      let sub_account = values.subAccounts[i];
      let account = await models.Account.findOne({
        where: {
          tenantId,
          accountCode: sub_account.account_code
        },
        transaction: t
      });

      let sub_account_rec = await models.SubAccount.create(
        {
          name: sub_account.name,
          key: sub_account.key,
          accountId: account.id,
          subAccountCode: sub_account.sub_account_code,
          taxClass: sub_account.tax_class,
          tenantId
        },
        { transaction: t }
      );

      await models.SubAccountRemaining.create(
        {
          subAccountId: sub_account_rec.id,
          term: sub_account.term,
          debit: 0,
          credit: 0,
          balance: 0,
          tenantId
        },
        { transaction: t }
      );
    }
  }
};

export const executeSetupWizard = async (tenantId, { startDate, endDate, term, year, companyClass, roundingMethod }) => {
  const t = await models.sequelize.transaction();
  try {
    const countFy = await models.FiscalYear.count({ where: { tenantId }, transaction: t });
    if (countFy > 0) {
      await t.rollback();
      return { success: false, code: -1, message: '既に初期設定が完了しています。' };
    }

    const fy = await models.FiscalYear.create(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        term: parseInt(term, 10),
        year: parseInt(year, 10),
        tenantId
      },
      { transaction: t }
    );

    await createInitialAccount(tenantId, parseInt(term, 10), parseInt(companyClass, 10), t);
    await createInitialMenuTemplates(tenantId, t);

    // Save tenant settings (roundingMethod) in Tenant.settings (multi-tenant safe, zero disk write)
    const tenant = await models.Tenant.findByPk(tenantId, { transaction: t });
    if (tenant) {
      const settings = tenant.settings || {};
      settings.roundingMethod = parseInt(roundingMethod, 10) || 1;
      await tenant.update({ settings }, { transaction: t });
    }

    await t.commit();
    return { success: true, code: 0, fiscalYear: fy };
  } catch (e) {
    if (!t.finished) await t.rollback();
    console.error('[executeSetupWizard] Error:', e);
    throw e;
  }
};
