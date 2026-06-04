import models from '../models/index.js';
const Op = models.Sequelize.Op;
import Accounts from '../libs/accounts.js';
import { enrichBilingual } from '../libs/bilingual-helper.js';

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let account_code = req.params.code;

    let account = await models.Account.findOne({
      where: {
        tenantId,
        accountCode: account_code
      },
      include: [{
        model: models.SubAccount,
        order: ['subAccountId', 'ASC'],
        as: 'subAccounts',
        where: { tenantId },
        required: false
      }],
    });
    if (!account) {
      return res.status(404).json({ error: `Account not found: ${account_code}` });
    }
    res.json(account);
  },
  get_class: (req, res, next) => {
    const tenantId = req.currentTenantId;
    let id = req.params.id;
    models.AccountClass.findOne({
      where: {
        tenantId,
        id: id
      }
    }).then(async (data) => {
      if (data) {
        const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
        if (lp) await enrichBilingual('AccountClass', [data], lp);
      }
      res.json(data);
    });
  },
  post: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let term = parseInt(req.params.term);
    let new_account = await models.Account.create({
      name: req.body.name,
      key: req.body.key,
      accountClassId: req.body.klass_id,
      accountCode: req.body.code,
      taxClass: req.body.tax_class,
      subAccountCount: 0,
      tenantId
    });
    await models.AccountRemaining.create({
      term: term,
      accountId: new_account.id,
      debit: req.body.debit,
      credit: req.body.credit,
      balance: req.body.balance,
      tenantId
    });
    res.json({
      accountCode: new_account.accountCode
    })
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let sub_code = req.body.sub_code;
    let term = parseInt(req.params.term);
    let account = await models.Account.findOne({
      where: {
        tenantId,
        accountCode: req.body.code
      }
    });
    if (!account) {
      return res.status(404).json({ error: `Account not found: ${req.body.code}` });
    }
    account.key = req.body.key;
    account.name = req.body.name;
    account.taxClass = req.body.tax_class;
    account.save();
    let rem = await models.AccountRemaining.findOne({
      where: {
        [Op.and]: {
          tenantId,
          term: term,
          accountId: account.id
        }
      }
    });
    if ( !rem ) {
      rem = new models.AccountRemaining({
        tenantId,
        term: term,
        accountId: account.id
      });
    }
    rem.debit = req.body.debit;
    rem.credit = req.body.credit;
    rem.balance = req.body.balance;
    rem.save();
    res.json({
      code: 0
    });
  },
  all: (req, res, next) => {
    const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
    Accounts.all(req.currentTenantId, lp).then((lines) => {
      res.json(lines);
    });
  },
  all2: async (req, res, next) => {
    const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
    Accounts.all2(req.currentTenantId, req.params.term, lp).then((lines) => {
      res.json(lines);
    });
  },
  all3: async (req, res, next) => {
    const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
    Accounts.all3(req.currentTenantId, req.params.term, lp).then((lines) => {
      res.json(lines);
    });
  },
  all4: async (req, res, next) => {
    const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
    Accounts.all4(req.currentTenantId, req.params.term, lp).then((lines) => {
      res.json(lines);
    });
  }
}
