import express from 'express';
const router = express.Router();
import fs from 'fs';
import {is_authenticated} from '../libs/user.js';
import {requireTenant} from '../libs/tenant.js';
import closing from '../forms/closing.js';

import journal from './api_journal.js';
import ledger from './api_ledger.js';
import account from './api_account.js';
import sub_account from './api_sub_account.js';
import remaining from './api_remaining.js';
import trial_balance from './api_trial_balance.js';
import company from './api_company.js';
import voucher from './api_voucher.js';
import user from './api_user.js';
import transaction from './api_transaction_document.js';
import admin from './api_admin.js';
import changes from './api_changes.js';
import setup from './api_setup.js';
import item from './api_item.js';
import tenantmember from './api_tenantmember.js';
import document from './api_document.js';
import task from './api_task.js';
import menu from './api_menu.js';
import term from './api-term.js';
import taxRule from './api-tax.js';
import project from './api-project.js';
import label from './api-label.js';
import projectSummary from './api-project-summary.js';

import cross_slip from './api_cross_slip.js';
import cross_slip_detail from './api_cross_slip_detail.js';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const VERSION = pkg.version;

router.post('/admin/backup', is_authenticated, requireTenant, admin.backup);
router.post('/admin/restore', is_authenticated, requireTenant, admin.restore);
router.get('/admin/backups', is_authenticated, requireTenant, admin.backups);
router.get('/admin/backup/:date', is_authenticated, requireTenant, admin.download);
router.post('/admin/upload', is_authenticated, requireTenant, admin.upload);
router.delete('/admin/backup/:date', is_authenticated, requireTenant, admin.delete);

router.get('/user', is_authenticated, user.get);
router.get('/user/tenants', is_authenticated, user.tenants);
router.get('/user/session-status', is_authenticated, user.sessionStatus);
router.get('/user/language-pair', is_authenticated, user.languagePair);
router.put('/user/language-pair', is_authenticated, user.updateLanguagePair);
router.post('/user/select-tenant', is_authenticated, user.selectTenant);
router.post('/user/tenant', is_authenticated, user.createTenant);
router.post('/tenant', is_authenticated, user.createTenant);
router.put('/user/tenant/:id', is_authenticated, user.updateTenant);
router.delete('/user/tenant/:id', is_authenticated, user.deleteTenant);
router.get('/user/:id', is_authenticated, requireTenant, user.get);
router.put('/user/password', is_authenticated, user.password);
router.put('/user/profile', is_authenticated, user.profile);
router.post('/user/logoff', is_authenticated, user.logoff);
router.post('/user/login', user.login);
router.post('/user/signup', user.signup);
router.put('/user/:id', is_authenticated, requireTenant, user.update);
router.delete('/user/:id', is_authenticated, requireTenant, user.delete);
router.get('/users/member', is_authenticated, requireTenant, user.members);
router.get('/users', is_authenticated, requireTenant, user.list);
router.get('/users/:id', is_authenticated, requireTenant, user.list);

router.get('/transaction', is_authenticated, requireTenant, transaction.get);
router.get('/transaction/kinds', is_authenticated, requireTenant, transaction.kindsGet);
router.put('/transaction/kinds', is_authenticated, requireTenant, transaction.kindsPut);
router.get('/transaction/:id', is_authenticated, requireTenant, transaction.get);
router.post('/transaction', is_authenticated, requireTenant, transaction.post);
router.put('/transaction', is_authenticated, requireTenant, transaction.update);
router.post('/transaction/book/:id', is_authenticated, requireTenant, transaction.book);
router.put('/transaction/:id', is_authenticated, requireTenant, transaction.update);
router.delete('/transaction/:id', is_authenticated, requireTenant, transaction.delete);

router.get('/task', is_authenticated, requireTenant, task.get);
router.get('/task/:id', is_authenticated, requireTenant, task.get);
router.post('/task', is_authenticated, requireTenant, task.post);
router.put('/task', is_authenticated, requireTenant, task.update);
router.put('/task/:id', is_authenticated, requireTenant, task.update);
router.delete('/task/:id', is_authenticated, requireTenant, task.delete);

router.get('/journal/:year/:month', is_authenticated, requireTenant, journal.get);

router.get('/ledger/:term/:account', is_authenticated, requireTenant, ledger.get);
router.get('/ledger/:term/:account/:sub_account', is_authenticated, requireTenant, ledger.get);

router.post('/closing/:term', is_authenticated, requireTenant, (req, res, next) => {
  if (( req.session.user.accounting ) ||
      ( req.session.user.fiscalBrowsing )) {
    closing(req.currentTenantId, parseInt(req.params.term)).then(() => {
      res.json({ code: 0});
    }).catch(next)
  } else {
    res.json({ code: -10});
  }
})

router.get('/changes/:term/:account', is_authenticated, requireTenant, changes.get);
router.get('/changes/:term/:account/:sub_account', is_authenticated, requireTenant, changes.get);

router.get('/remaining/:term/:account', is_authenticated, requireTenant, remaining.get);
router.get('/remaining/:term/:account/:sub_account', is_authenticated, requireTenant, remaining.get);

router.get('/accounts', is_authenticated, requireTenant, account.all);
router.get('/accounts2/:term', is_authenticated, requireTenant, account.all2);
router.get('/accounts3/:term', is_authenticated, requireTenant, account.all3);
router.get('/accounts4/:term', is_authenticated, requireTenant, account.all4);
router.get('/account/:code', is_authenticated, requireTenant, account.get);
router.get('/account-class/:id', is_authenticated, requireTenant, account.get_class);
router.put('/account/:term', is_authenticated, requireTenant, account.update);
router.post('/account/:term', is_authenticated, requireTenant, account.post);

router.put('/sub_account/:term', is_authenticated, requireTenant, sub_account.update);
router.post('/sub_account/:term', is_authenticated, requireTenant, sub_account.post);

router.get('/cross_slip/:year/:month/:no', is_authenticated, requireTenant, cross_slip.get);
router.get('/cross_slips/:type', is_authenticated, requireTenant, cross_slip.list);
router.post('/cross_slip', is_authenticated, requireTenant, cross_slip.post);
router.put('/cross_slip', is_authenticated, requireTenant, cross_slip.update);
router.put('/cross_slip/approve', is_authenticated, requireTenant, cross_slip.approve);
router.delete('/cross_slip', is_authenticated, requireTenant, cross_slip.delete);

router.get('/cross-slip-detail/:id', is_authenticated, requireTenant, cross_slip_detail.get);
router.put('/cross-slip-detail', is_authenticated, requireTenant, cross_slip_detail.update);

router.get('/trial-balance', is_authenticated, requireTenant, trial_balance.get);
router.get('/trial-balance/:param', is_authenticated, requireTenant, trial_balance.get);

router.get('/company', is_authenticated, requireTenant, company.get);
router.get('/company/kinds', is_authenticated, requireTenant, company.kindsGet);
router.put('/company/kinds', is_authenticated, requireTenant, company.kindsPut);
router.get('/company/info', is_authenticated, requireTenant, company.infoGet);
router.put('/company/info', is_authenticated, requireTenant, company.infoPut);
router.get('/company/:id', is_authenticated, requireTenant, company.get);
router.post('/company', is_authenticated, requireTenant, company.post);
router.put('/company', is_authenticated, requireTenant, company.update);
router.put('/company/:id', is_authenticated, requireTenant, company.update);
router.delete('/company', is_authenticated, requireTenant, company.delete);
router.delete('/company/:id', is_authenticated, requireTenant, company.delete);

router.get('/voucher/classes', is_authenticated, requireTenant, voucher.classesGet);
router.put('/voucher/classes', is_authenticated, requireTenant, voucher.classesPut);
router.get('/voucher', is_authenticated, requireTenant, voucher.get);
router.get('/voucher/:id', is_authenticated, requireTenant, voucher.get);
router.post('/voucher', is_authenticated, requireTenant, voucher.post);
router.post('/voucher/upload/:id', is_authenticated, requireTenant, voucher.upload);
router.post('/voucher/upload', is_authenticated, requireTenant, voucher.upload);
router.put('/voucher', is_authenticated, requireTenant, voucher.update);
router.put('/voucher/bind', is_authenticated, requireTenant, voucher.bind);
router.put('/voucher/:id', is_authenticated, requireTenant, voucher.update);
router.delete('/voucher', is_authenticated, requireTenant, voucher.delete);
router.delete('/voucher/file', is_authenticated, requireTenant, voucher.deleteFile);
router.delete('/voucher/:id', is_authenticated, requireTenant, voucher.delete);
router.get('/voucher/files/:id', is_authenticated, requireTenant, voucher.files);

router.get('/item/classes', is_authenticated, requireTenant, item.classesGet);
router.put('/item/classes', is_authenticated, requireTenant, item.classesPut);
router.get('/item', is_authenticated, requireTenant, item.get);
router.get('/item/:id', is_authenticated, requireTenant, item.get);
router.post('/item', is_authenticated, requireTenant, item.post);
router.put('/item', is_authenticated, requireTenant, item.update);
router.put('/item/:id', is_authenticated, requireTenant, item.update);
router.delete('/item', is_authenticated, requireTenant, item.delete);
router.delete('/item/:id', is_authenticated, requireTenant, item.delete);

router.get('/document', is_authenticated, requireTenant, document.get);
router.get('/document/:id', is_authenticated, requireTenant, document.get);
router.get('/document/file/:id', is_authenticated, requireTenant, document.file);
router.post('/document', is_authenticated, requireTenant, document.post);
router.post('/document/upload/:id', is_authenticated, requireTenant, document.upload);
router.post('/document/upload', is_authenticated, requireTenant, document.upload);
router.put('/document', is_authenticated, requireTenant, document.update);
router.put('/document/bind', is_authenticated, requireTenant, document.bind);
router.put('/document/:id', is_authenticated, requireTenant, document.update);
router.delete('/document', is_authenticated, requireTenant, document.delete);
router.delete('/document/file', is_authenticated, requireTenant, document.deleteFile);
router.delete('/document/:id', is_authenticated, requireTenant, document.delete);
router.get('/document/files/:id', is_authenticated, requireTenant, document.files);

router.get('/member/classes', is_authenticated, requireTenant, tenantmember.classes);
router.get('/member', is_authenticated, requireTenant, tenantmember.get);
router.get('/member/:id', is_authenticated, requireTenant, tenantmember.get);
router.post('/member', is_authenticated, requireTenant, tenantmember.post);
router.put('/member', is_authenticated, requireTenant, tenantmember.update);
router.put('/member/:id', is_authenticated, requireTenant, tenantmember.update);
router.delete('/member', is_authenticated, requireTenant, tenantmember.delete);
router.delete('/member/:id', is_authenticated, requireTenant, tenantmember.delete);

router.get('/menu/templates', is_authenticated, requireTenant, menu.getTemplates);
router.get('/menu/preview', is_authenticated, requireTenant, menu.preview);
router.get('/menu/:id', is_authenticated, requireTenant, menu.get);
router.get('/menu', is_authenticated, requireTenant, menu.get);
router.post('/menu', is_authenticated, requireTenant, menu.post);
router.put('/menu', is_authenticated, requireTenant, menu.update);
router.put('/menu/:id', is_authenticated, requireTenant, menu.update);
router.delete('/menu/:id', is_authenticated, requireTenant, menu.delete);

router.get('/term/:year/:month', is_authenticated, requireTenant, term.get);
router.get('/term/:term', is_authenticated, requireTenant, term.get);
router.get('/term', is_authenticated, requireTenant, term.get);
router.put('/term/:id', is_authenticated, requireTenant, term.update);

router.get('/tax-rule/', is_authenticated, requireTenant, taxRule.get);
router.put('/tax-rule/', is_authenticated, requireTenant, taxRule.put);

router.get('/projects', is_authenticated, requireTenant, project.get);
router.get('/project/:id', is_authenticated, requireTenant, project.get);
router.post('/project', is_authenticated, requireTenant, project.create);
router.put('/project/:id', is_authenticated, requireTenant, project.update);
router.delete('/project/:id', is_authenticated, requireTenant, project.delete);
router.get('/projects/:id/labels', is_authenticated, requireTenant, project.getLabels);
router.put('/projects/:id/labels', is_authenticated, requireTenant, project.updateLabels);

router.get('/labels', is_authenticated, requireTenant, label.get);
router.post('/labels', is_authenticated, requireTenant, label.create);
router.get('/labels/:id/accounts', is_authenticated, requireTenant, label.getAccounts);
router.put('/labels/:id/accounts', is_authenticated, requireTenant, label.updateAccounts);
router.delete('/labels/:id', is_authenticated, requireTenant, label.delete);
router.put('/labels/:id', is_authenticated, requireTenant, label.update);

router.get('/project-summary/:projectId', is_authenticated, requireTenant, projectSummary.get);

router.post('/setup', is_authenticated, requireTenant, setup)

router.get('/version', is_authenticated, (req, res, next) => {
  res.json({version: VERSION});
});

export default router;