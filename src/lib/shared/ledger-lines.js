import { dc, numeric } from '$lib/shared/parse_account_code.js';
import { findAccount, findSubAccountByCode } from '$lib/client/cross-slip.js';

export const ledgerLines = (account_code, sub_account_code, remaining, details) => {
  let lines = [];
  let sums;
  if (!remaining) {
    remaining = {
      debit: 0,
      credit: 0,
      balance: 0
    };
  }
  if (dc(account_code) == 'D') {
    sums = {
      debitAmount: numeric(remaining.balance),
      debitTax: 0,
      creditAmount: 0,
      creditTax: 0,
      balance: numeric(remaining.balance)
    };
  } else {
    sums = {
      debitAmount: 0,
      debitTax: 0,
      creditAmount: numeric(remaining.balance),
      creditTax: 0,
      balance: numeric(remaining.balance)
    };
  }
  let pickup = {
    balance: sums.balance
  };

  details = details || [];

  for (let i = 0; i < details.length; i++) {
    let detail = details[i];

    let debitAmount;
    let creditAmount;
    let debitTax;
    let creditTax;
    let otherAccount;
    let otherSubAccount;
    let thisAccount;
    let thisSubAccount;
    let thisTaxRule;
    let otherTaxRule;
    let pureDebitAmount;
    let pureCreditAmount;
    let pureDebitTax;
    let pureCreditTax;
    let showDebit;
    let showCredit;

    pureDebitTax = numeric(detail.debitTax);
    debitAmount = numeric(detail.debitAmount);
    if (detail.debitAccount) {
      pureDebitAmount = debitAmount;
    } else {
      debitAmount = 0;
      pureDebitAmount = 0;
    }
    pureCreditTax = numeric(detail.creditTax);
    creditAmount = numeric(detail.creditAmount);
    if (detail.creditAccount) {
      pureCreditAmount = creditAmount;
    } else {
      creditAmount = 0;
      pureCreditAmount = 0;
    }

    if (
      (sub_account_code && sub_account_code === detail.debitSubAccount && account_code === detail.debitAccount) ||
      (!sub_account_code && account_code === detail.debitAccount)
    ) {
      thisAccount = detail.debitAccount;
      thisSubAccount = detail.debitSubAccount;
      thisTaxRule = detail.debitTaxRule;
      otherAccount = detail.creditAccount;
      otherSubAccount = detail.creditSubAccount;
      otherTaxRule = detail.creditTaxRule;

      sums.debitAmount += pureDebitAmount;
      sums.debitTax += pureDebitTax;
      showDebit = true;

      if (
        (sub_account_code && sub_account_code === detail.creditSubAccount && account_code === detail.creditAccount) ||
        (!sub_account_code && account_code === detail.creditAccount)
      ) {
        showCredit = true;
        sums.creditAmount += pureCreditAmount;
        sums.creditTax += pureCreditTax;
        if (dc(account_code) == 'D') {
          sums.balance += pureDebitAmount - pureCreditAmount;
        } else {
          sums.balance -= pureDebitAmount - pureCreditAmount;
        }
      } else {
        showCredit = false;
        creditAmount = '';
        creditTax = '';
        if (dc(account_code) == 'D') {
          sums.balance += pureDebitAmount;
        } else {
          sums.balance -= pureDebitAmount;
        }
      }
    } else {
      thisAccount = detail.creditAccount;
      thisSubAccount = detail.creditSubAccount;
      thisTaxRule = detail.creditTaxRule;
      otherAccount = detail.debitAccount;
      otherSubAccount = detail.debitSubAccount;
      otherTaxRule = detail.debitTaxRule;

      sums.creditAmount += pureCreditAmount;
      sums.creditTax += pureCreditTax;
      showCredit = true;
      if (
        (sub_account_code && sub_account_code === detail.debitSubAccount && account_code === detail.debitAccount) ||
        (!sub_account_code && account_code === detail.debitAccount)
      ) {
        showDebit = true;
        sums.debitAmount += pureDebitAmount;
        sums.debitTax += pureDebitTax;
        if (dc(account_code) == 'D') {
          sums.balance -= pureCreditAmount - pureDebitAmount;
        } else {
          sums.balance += pureCreditAmount - pureDebitAmount;
        }
      } else {
        showDebit = false;
        debitAmount = '';
        debitTax = '';
        if (dc(account_code) == 'D') {
          sums.balance -= pureCreditAmount;
        } else {
          sums.balance += pureCreditAmount;
        }
      }
    }
    lines.push({
      year: detail.crossSlip ? detail.crossSlip.year : 0,
      month: detail.crossSlip ? detail.crossSlip.month : 0,
      day: detail.crossSlip ? detail.crossSlip.day : 0,
      approvedAt: detail.crossSlip ? detail.crossSlip.approvedAt : null,
      no: detail.crossSlip ? detail.crossSlip.no : '',

      accountCode: account_code,
      subAccountCode: thisSubAccount,

      subAccount: findSubAccountByCode(account_code, thisSubAccount).name,
      otherAccount: findAccount(otherAccount).name == '' ? '諸口' : findAccount(otherAccount).name,
      otherSubAccount: findSubAccountByCode(otherAccount, otherSubAccount).name,

      thisTaxRule: thisTaxRule ? thisTaxRule.label : '',
      otherTaxRule: otherTaxRule ? otherTaxRule.label : '',
      debitTaxRule: detail.debitTaxRule ? detail.debitTaxRule.label : '',
      creditTaxRule: detail.creditTaxRule ? detail.creditTaxRule.label : '',

      application1: detail.application1,
      application2: detail.application2,

      debitVoucher: detail.debitVoucher,
      creditVoucher: detail.creditVoucher,

      projectName: detail.projectData ? detail.projectData.name : '',
      projectId: detail.projectId,

      otherAccountCode: otherAccount,
      otherSubAccountCode: otherSubAccount,
      pureDebitAmount: pureDebitAmount,
      pureDebitTax: pureDebitTax,
      pureCreditAmount: pureCreditAmount,
      pureCreditTax: pureCreditTax,
      pureBalance: sums.balance,
      debitAmount: debitAmount,
      creditAmount: creditAmount,
      showDebit: showDebit,
      showCredit: showCredit
    });
  }

  return {
    lines: lines,
    sums: sums,
    pickup: pickup
  };
};
