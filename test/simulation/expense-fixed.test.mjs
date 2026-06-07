/**
 * Expense fixed generator — Issue #266 (E3.5).
 *
 * Verifies fixed / percent_of_sales / headcount types,
 * payment timing offset, debit==credit invariant.
 */

import { strict as assert } from 'node:assert';
import { generateExpenseFixedEntries } from '../../libs/simulation/assumption-generator.js';

const SCENARIO = { simPeriodFrom: '2026-01-01', simPeriodTo: '2026-12-31' };

describe('Simulation — E3.5 expense_fixed generator', function () {
  describe('1) fixed amount', function () {
    it('constant amount each month', function () {
      const a = {
        name: 'Fixed rent', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          amountType: 'fixed', amount: 200000,
          expenseAccount: '5000', counterAccount: '2000',
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].debitAmount, 200000);
      assert.equal(entries[1].debitAmount, 200000);
      assert.equal(entries[2].debitAmount, 200000);
    });
  });

  describe('2) percent_of_sales', function () {
    it('calculates % of monthly sales', function () {
      const a = {
        name: 'Commission', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          amountType: 'percent_of_sales', percentOfValue: 10,
          expenseAccount: '5000', counterAccount: '2000',
        },
      };
      const sales = [1000000, 2000000, 1500000];
      const entries = generateExpenseFixedEntries(a, SCENARIO, sales);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].debitAmount, 100000);  // 10% of 1M
      assert.equal(entries[1].debitAmount, 200000);  // 10% of 2M
      assert.equal(entries[2].debitAmount, 150000);  // 10% of 1.5M
    });

    it('handles missing sales as 0', function () {
      const a = {
        name: 'Zero sales', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          amountType: 'percent_of_sales', percentOfValue: 10,
          expenseAccount: '5000', counterAccount: '2000',
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO, []);
      assert.equal(entries.length, 0); // 0 sales → 0 amount → skipped
    });
  });

  describe('3) headcount', function () {
    it('1 assumption → 2 entries per month (salary + insurance)', function () {
      const a = {
        name: 'Team salary', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          amountType: 'headcount',
          expenseAccount: '5000', counterAccount: '2000',
          headcount: {
            count: 5,
            salaryPerMonth: 400000,
            salaryAccount: '5100',
            insuranceAccount: '5200',
            insurancePct: 15,
          },
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO);
      // 2 entries: salary + insurance
      assert.equal(entries.length, 2);
      // Salary: 5 * 400000 = 2000000
      const salaryEntry = entries.find(e => e.memo.includes('salary'));
      assert.ok(salaryEntry);
      assert.equal(salaryEntry.debitAccount, '5100');
      assert.equal(salaryEntry.debitAmount, 2000000);
      assert.equal(salaryEntry.creditAmount, 2000000);
      // Insurance: 2000000 * 15% = 300000
      const insEntry = entries.find(e => e.memo.includes('insurance'));
      assert.ok(insEntry);
      assert.equal(insEntry.debitAccount, '5200');
      assert.equal(insEntry.debitAmount, 300000);
      assert.equal(insEntry.creditAmount, 300000);
    });

    it('headcount + paymentTimingDays → 3 entries per month', function () {
      const a = {
        name: 'Team w/ payment', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          amountType: 'headcount',
          expenseAccount: '5000', counterAccount: '2000',
          paymentTimingDays: 30,
          headcount: {
            count: 2,
            salaryPerMonth: 300000,
            salaryAccount: '5100',
            insuranceAccount: '5200',
            insurancePct: 15,
          },
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO);
      // salary + insurance + cash payment
      assert.equal(entries.length, 3);
      const payment = entries.find(e => e.memo.startsWith('Team w/ payment (payment'));
      assert.ok(payment);
      assert.equal(payment.date, '2026-01-31');
      // salary 600k + insurance 90k = 690k total cash out
      assert.equal(payment.creditAmount, 690000);
    });
  });

  describe('4) payment timing offset', function () {
    it('adds cash entry with timingDays offset', function () {
      const a = {
        name: 'Deferred pay', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          amountType: 'fixed', amount: 50000,
          expenseAccount: '5000', counterAccount: '2000',
          paymentTimingDays: 30,
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO);
      // 1 accrual + 1 cash
      assert.equal(entries.length, 2);
      assert.equal(entries[0].date, '2026-01-01');
      assert.equal(entries[0].debitAccount, '5000'); // expense
      assert.equal(entries[1].date, '2026-01-31');
      assert.equal(entries[1].creditAccount, '1000'); // cash
    });
  });

  describe('5) invariants', function () {
    it('every entry debits == credits', function () {
      const a = {
        name: 'Balance check', startMonth: '2026-01-01', endMonth: '2026-06-30',
        parameters: {
          amountType: 'fixed', amount: 100000,
          expenseAccount: '5000', counterAccount: '2000',
          paymentTimingDays: 30,
        },
      };
      const entries = generateExpenseFixedEntries(a, SCENARIO);
      assert.ok(entries.length > 0);
      for (const e of entries) {
        assert.equal(e.debitAmount, e.creditAmount,
          `entry ${e.date} (${e.memo}) not balanced: ${e.debitAmount} vs ${e.creditAmount}`);
      }
    });
  });
});
