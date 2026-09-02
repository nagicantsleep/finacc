import chartAccountsTemplate from './data/chart-accounts-template.js';

/**
 * Returns initial chart of accounts template (classes, accounts, subAccounts)
 * for a new fiscal term and company class.
 *
 * @param {number} term Fiscal year term number (e.g. 1, 2)
 * @param {number} companyClass 1 for 法人 (Houjin/Corporate), 2 for 個人事業主 (Kojin/Sole Proprietorship)
 * @returns {{ accountClasses: Array, accounts: Array, subAccounts: Array }}
 */
export const exec = (term, companyClass) => {
  const target = companyClass === 2 ? chartAccountsTemplate.kojin : chartAccountsTemplate.houjin;

  return {
    accountClasses: target.accountClasses.map((c) => ({ ...c })),
    accounts: target.accounts.map((a) => ({ ...a, term })),
    subAccounts: target.subAccounts.map((s) => ({ ...s, term }))
  };
};

export default exec;
