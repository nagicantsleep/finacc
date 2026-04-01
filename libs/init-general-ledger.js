import {burstPage} from './utils.js';
import {ledgerLines} from './ledger.js';
import Accounts from './accounts.js';
import {get_details} from '../routes/api_ledger.js';

const ledgerPages = async (term, account, tenantId) => {
  const { default: models } = await import('../models/index.js');
  
  const fy = await models.FiscalYear.findOne({
    where: { term, tenantId }
  });
  
  const LINES = 17;

  let pages = [];
  let details = await get_details(fy, account.code, null, tenantId);
  let ledger = ledgerLines(account.code, null, account, details);
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
    pages: pages,
    sums: sums,
    pickup: pickup.balance
  });
}

export default async (term, tenantId) => {
  const { default: models } = await import('../models/index.js');
  
  let fy = await models.FiscalYear.findOne({
    where: { tenantId, term }
  });

  let accounts = await Accounts.all2(tenantId, term);
  let accountLines = [];
  let ledgerLines = [];
  for ( let account of accounts ) {
    let ledger = await ledgerPages(term, account, tenantId);
    //console.log({ledger});
    if  (( ledger.sums.debit ) ||
         ( ledger.sums.credit ) ||
         ( ledger.sums.balance ) ||
         ( ledger.pages[0].lines.length > 0 )) {
      accountLines.push({
        code: account.code,
        name: account.name,
        taxClass: account.taxClass,
        debit: ledger.sums.debitAmount,
        credit: ledger.sums.creditAmount,
        balance: ledger.sums.balance
      });
      ledgerLines.push(ledger);
    }
  }

  let account_pages = burstPage(accountLines, 46);

  return  ({
    fy: fy,
    accountPages: account_pages,
    ledgerPages: ledgerLines
  })
}