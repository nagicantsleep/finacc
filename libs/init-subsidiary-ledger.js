import {numeric, formatDate, burstPage } from './utils.js';
import {setAccounts, findAccount, findSubAccountByCode} from '../front/javascripts/cross-slip.js';
import {ledgerLines} from './ledger.js';
import Accounts from './accounts.js';
import {get_details} from '../routes/api_ledger.js';

const ledgerPages = async (term, account, subAccount, tenantId) => {
  const { default: models } = await import('../models/index.js');
  
  const fy = await models.FiscalYear.findOne({
    where: { term, tenantId }
  });
  
  const LINES = 17;

  let pages = [];
  let details = await get_details(fy, account.code, subAccount.code, tenantId);
  let ledger = ledgerLines(account.code, subAccount.code, subAccount, details);
  let {lines, pickup, sums} = ledger;
  let page = [];
  let balance = pickup.balance;
  let line_1;
  for	( let line of lines )	{
    if	( page.length === LINES )	{
      pages.push({
        lines: page,
        balance: balance
      });
      balance = line_1.pureBalance;
      page = [];
    }
    page.push(line);
    line_1 = line;
  }
  pages.push({
    lines: page,
    balance: balance
  });
  return  ({
    name: account.name,
    sub_name: subAccount.name,
    pages: pages,
    sums: sums
  });
}

export default async (term, tenantId) => {
  const { default: models } = await import('../models/index.js');
  
  let fy = await models.FiscalYear.findOne({
    where: { tenantId, term }
  });

  let accounts = await Accounts.all2(tenantId, term);

  let ledgerLines = [];
  for ( let account of accounts ) {
    if  ( account.subAccounts ) {
      for ( let subAccount of account.subAccounts ) {
        let ledger = await ledgerPages(term, account, subAccount, tenantId);
        if  (( ledger.sums.debit ) ||
             ( ledger.sums.credit ) ||
             ( ledger.sums.balance )) {
          ledgerLines.push(ledger);
        }
      }
    }
  }

  return  ({
    fy: fy,
    ledgerPages: ledgerLines
  })
}