import models from '../models/index.js';
import parseAccounts from '../libs/parse_accounts.js';
import {getCompanyInfo, putCompanyInfo} from '../libs/utils.js';

const createInitialMenuTemplates = async (tenantId, t) => {
  const accountingBody = JSON.stringify([
    { id: 'w1', x: 0, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'journal',       title: '仕訳日記帳', description: '伝票入力等の基本画面です。' } },
    { id: 'w2', x: 3, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'ledger',        title: '元帳',       description: '総勘定元帳と補助元帳が複合した画面です。' } },
    { id: 'w3', x: 6, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'trial-balance', title: '残高試算表', description: '残高試算表が確認できます。' } },
    { id: 'w4', x: 9, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'changes',       title: '推移表',     description: '科目毎の月次集計の推移をグラフ表示します。' } },
  ]);
  const homeBody = JSON.stringify([
    { id: 'w5', x: 0, y: 0, w: 6, h: 29, minimize: false, component: 'SelectTerm', options: { title: '期の選択' } },
    { id: 'w6', x: 6, y: 0, w: 4, h: 29, minimize: false, component: 'Password',   options: { title: 'パスワード変更' } },
  ]);
  await models.Menu.bulkCreate([
    { tenantId, userId: null, title: '会計メニュー', displayOrder: 1, body: accountingBody },
    { tenantId, userId: null, title: 'ホームメニュー', displayOrder: 2, body: homeBody },
  ], { transaction: t });
};

const createInitialAccount = async (tenantId, term, companyClass, t) => {
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
  await models.AccountClass.bulkCreate(accountClasses,{ transaction: t });
  accountClasses = await models.AccountClass.findAll({ where: { tenantId }, transaction: t });
  for ( let i = 0; i < values.accounts.length; i ++ ) {
    let account = values.accounts[i];
    let account_class = await models.AccountClass.findOne({
      where: {
        tenantId,
        field: account.field,
        adding: account.adding
      },
      transaction: t 
    });
    let account_rec = await models.Account.create({
      name: account.name,
      key: account.key,
      accountClassId: account_class.id,
      accountCode: account.account_code,
      taxClass: account.tax_class,
      subAccountCount: account.sub_account_count,
      tenantId,
      createdAt: now,
      updatedAt: now
    },{ transaction: t });
    account.rec_id = account_rec.id;
  }
  for ( let i = 0; i < values.accounts.length; i ++ ) {
    let account = values.accounts[i];
    await models.AccountRemaining.create({
      accountId: account.rec_id,
      term: account.term,
      debit: 0,
      credit: 0,
      balance: 0,
      tenantId
    },{ transaction: t });
  }
  if	( values.subAccounts )	{
    for ( let i = 0; i < values.subAccounts.length; i ++ ) {
      let sub_account = values.subAccounts[i];
      let account = await models.Account.findOne({
        where: {
          tenantId,
          accountCode: sub_account.account_code,
        },
        transaction: t });
      let sub_account_rec = await models.SubAccount.create({
        name: sub_account.name,
        key: sub_account.key,
        accountId: account.id,
        subAccountCode: sub_account.sub_account_code,
        taxClass: sub_account.tax_class,
        tenantId
      },{ transaction: t });
      await models.SubAccountRemaining.create({
        subAccountId: sub_account_rec.id,
        term: sub_account.term,
        debit: 0,
        credit: 0,
        balance: 0,
        tenantId
      },{ transaction: t });
    }
  }
}

export const setup = async (req, res, next) => {
  const tenantId = req.currentTenantId;
	const countFy = await models.FiscalYear.count({ where: { tenantId } });
  if ( countFy === 0 ){
    const t = await models.sequelize.transaction();
    try {
      const fy =  await models.FiscalYear.create({
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        term: req.body.term,
        year: req.body.year,
        tenantId
      },{ transaction: t });
      await createInitialAccount(tenantId, req.body.term, req.body.companyClass, t);
      await createInitialMenuTemplates(tenantId, t);
      getCompanyInfo(req.currentTenantId).then(async (company) => {
        company.roundingMethod = req.body.roundingMethod;
        await putCompanyInfo(company, req.currentTenantId);
      })
      await t.commit();
      req.session.term = req.body.term;
      req.session.save();
      res.json({code: 0});
    }catch(e){
      console.log(e)
      await t.rollback();
      res.json({code: -99});
    }
  }else{
    // exists FiscalYear
    res.json({code: -1});
  }
}

export default setup;
