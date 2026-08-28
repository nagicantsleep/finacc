import models from '$lib/server/db/index.js';
import CrossSlipDetails from '$lib/server/crossslipdetails.js';
import Accounts from '$lib/server/accounts.js';
import { field, numeric, dc } from '$lib/server/parse_account_code.js';
import TrialBalance from '$lib/server/trial_balance.js';

function closingLedgerSums(account_code, sub_account_code, remaining, details) {
  if (!remaining) remaining = { debit: 0, credit: 0, balance: 0 };
  const sums =
    dc(account_code) == 'D'
      ? {
          debitAmount: numeric(remaining.balance),
          creditAmount: 0,
          balance: numeric(remaining.balance)
        }
      : {
          debitAmount: 0,
          creditAmount: numeric(remaining.balance),
          balance: numeric(remaining.balance)
        };
  for (let i = 0; i < details.length; i += 1) {
    const detail = details[i];
    let pureDebitAmount = detail.debitAccount ? numeric(detail.debitAmount) : 0;
    let pureCreditAmount = detail.creditAccount ? numeric(detail.creditAmount) : 0;
    const debitMatch =
      (sub_account_code &&
        sub_account_code === detail.debitSubAccount &&
        account_code === detail.debitAccount) ||
      (!sub_account_code && account_code === detail.debitAccount);
    const creditMatch =
      (sub_account_code &&
        sub_account_code === detail.creditSubAccount &&
        account_code === detail.creditAccount) ||
      (!sub_account_code && account_code === detail.creditAccount);
    if (debitMatch) {
      sums.debitAmount += pureDebitAmount;
      if (creditMatch) {
        sums.creditAmount += pureCreditAmount;
        if (dc(account_code) == 'D') sums.balance += pureDebitAmount - pureCreditAmount;
        else sums.balance -= pureDebitAmount - pureCreditAmount;
      } else if (dc(account_code) == 'D') sums.balance += pureDebitAmount;
      else sums.balance -= pureDebitAmount;
    } else {
      sums.creditAmount += pureCreditAmount;
      if (dc(account_code) == 'D') sums.balance -= pureCreditAmount;
      else sums.balance += pureCreditAmount;
    }
  }
  return { sums };
}

function netIncomeFromTb(lines) {
  const sumByCode = (regex) =>
    lines.reduce(
      (acc, line) => {
        if ((line.debit || line.credit || line.balance) && line.code && regex.test(line.code)) {
          acc.debit += line.debit;
          acc.credit += line.credit;
          acc.balance += line.balance;
        }
        return acc;
      },
      { debit: 0, credit: 0, balance: 0 }
    );
  const collectByAcl = (regex) => {
    const result = { debit: 0, credit: 0, balance: 0 };
    for (const line of lines) {
      if ((line.debit || line.credit || line.balance) && line.acl_code && regex.test(line.acl_code)) {
        result.debit += line.debit;
        result.credit += line.credit;
        result.balance += line.balance;
      }
    }
    return result;
  };
  const grossMargin = sumByCode(/^600/).balance;
  const purchase = sumByCode(/^700/).balance;
  const subcontract = sumByCode(/^701/).balance;
  const openingInv = sumByCode(/7020000/).balance;
  const closingInv = sumByCode(/7020010/).credit;
  const cogs = openingInv + purchase + subcontract;
  const grossProfit = grossMargin - (cogs - closingInv);
  const sga = sumByCode(/^703/).balance;
  const operatingProfit = grossProfit - sga;
  const nonOpIncome = collectByAcl(/^8/).balance;
  const nonOpExpenses = collectByAcl(/^900/).balance;
  const extraGain = sumByCode(/^901/).balance;
  const extraLoss = sumByCode(/^902/).balance;
  const recurringProfit = operatingProfit + nonOpIncome - nonOpExpenses;
  const currentIncome = recurringProfit + extraGain - extraLoss;
  const tax = sumByCode(/^903/).balance;
  return currentIncome - tax;
}

const fiscalYear = async (term, tenantId) => {
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });
  let nfy = await models.FiscalYear.findOne({ where: { tenantId, term: fy.term + 1 } });
  if (!nfy) {
    nfy = await models.FiscalYear.create({
      tenantId,
      startDate: new Date(
        new Date(fy.startDate).getFullYear() + 1,
        new Date(fy.startDate).getMonth(),
        new Date(fy.startDate).getDate()
      ),
      endDate: new Date(
        new Date(fy.endDate).getFullYear() + 1,
        new Date(fy.endDate).getMonth(),
        new Date(fy.endDate).getDate()
      ),
      term: fy.term + 1,
      year: fy.year + 1
    });
  }
  return [fy, nfy];
};

const runAccountClose = async (arg, carry, tenantId) => {
  const fy = arg[0];
  const nfy = arg[1];
  const accounts = await Accounts.all3(tenantId, fy.term);
  for (let i = 0; i < accounts.length; i += 1) {
    const acc = accounts[i];
    if (acc.subAccounts) {
      const subs = acc.subAccounts;
      for (let j = 0; j < subs.length; j += 1) {
        const sub = subs[j];
        let rem = await models.SubAccountRemaining.findOne({
          where: { tenantId, subAccountId: sub.id, term: nfy.term }
        });
        if (!rem) {
          rem = await models.SubAccountRemaining.create({
            tenantId,
            subAccountId: sub.id,
            term: nfy.term,
            debit: 0,
            credit: 0,
            balance: 0
          });
        } else {
          rem.debit = 0;
          rem.credit = 0;
          rem.balance = 0;
        }
        if (field(acc.code) < 6) {
          const pickup = {
            debit: numeric(sub.debit),
            credit: numeric(sub.credit),
            balance: numeric(sub.balance)
          };
          const details = await CrossSlipDetails.all(fy, acc.code, sub.code, tenantId);
          const lines = closingLedgerSums(acc.code, sub.code, pickup, details);
          rem.debit = lines.sums.debitAmount;
          rem.credit = lines.sums.creditAmount;
          rem.balance = lines.sums.balance;
          await rem.save();
        } else {
          await rem.save();
        }
      }
    }
    if (acc.id) {
      let remaining = await models.AccountRemaining.findOne({
        where: { tenantId, accountId: acc.id, term: nfy.term }
      });
      if (!remaining) {
        remaining = await models.AccountRemaining.create({
          tenantId,
          accountId: acc.id,
          term: nfy.term,
          debit: 0,
          credit: 0,
          balance: 0
        });
      } else {
        remaining.debit = 0;
        remaining.credit = 0;
        remaining.balance = 0;
      }
      if (acc.code == '5040000') {
        remaining.debit = 0;
        remaining.credit = carry.balance;
        remaining.balance = carry.balance;
        await remaining.save();
      } else if (field(acc.code) < 6) {
        const pickup = {
          debit: numeric(acc.debit),
          credit: numeric(acc.credit),
          balance: numeric(acc.balance)
        };
        const details = await CrossSlipDetails.all(fy, acc.code, undefined, tenantId);
        const lines = closingLedgerSums(acc.code, null, pickup, details);
        remaining.debit = lines.sums.debitAmount;
        remaining.credit = lines.sums.creditAmount;
        remaining.balance = lines.sums.balance;
        await remaining.save();
      } else {
        await remaining.save();
      }
    }
  }
};

const accountLine = (lines, code) => {
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].code == code) return lines[i];
  }
  return undefined;
};

const netIncome = (lines) => {
  const income = netIncomeFromTb(lines);
  const line = accountLine(lines, '5040000');
  line.credit += income;
  line.balance = line.pickup - line.debit + line.credit;
  return line;
};

export default async function runYearEndClosing(tenantId, term) {
  if (tenantId == null) throw new Error('closing: tenantId is required (multi-tenant guard)');
  if (term == null) throw new Error('closing: term is required');
  const fy = await fiscalYear(term, tenantId);
  const { lines } = await TrialBalance(tenantId, term);
  const carry = netIncome(lines);
  await runAccountClose(fy, carry, tenantId);
}
