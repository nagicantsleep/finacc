/**
 * Recurring generator — Issue #264 (E3.3).
 *
 * Verifies:
 *   1. Monthly frequency generates correct number of entries
 *   2. Quarterly = 3-month step
 *   3. Yearly = 1 per year
 *   4. Day 31/2 falls back to last day of month
 *   5. Range bounds (startMonth / endMonth / simPeriod boundary)
 *   6. Increase rule (percent / fixed)
 *   7. Each entry debit == credit
 */

import { strict as assert } from 'node:assert';
import { generateRecurringEntries } from '../../libs/simulation/assumption-generator.js';

const SCENARIO = {
  simPeriodFrom: '2026-01-01',
  simPeriodTo: '2026-12-31',
};

describe('Simulation — E3.3 recurring generator', function () {
  describe('1) monthly frequency', function () {
    it('generates 12 entries for a full year', function () {
      const a = {
        name: 'Monthly rent', startMonth: '2026-01-01', endMonth: '2026-12-31',
        parameters: { frequency: 'monthly', dayOfMonth: 1, debitAccount: '5000', creditAccount: '2000', amount: 100000 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 12);
      assert.equal(entries[0].date, '2026-01-01');
      assert.equal(entries[11].date, '2026-12-01');
    });

    it('clamps to scenario simPeriod', function () {
      const a = {
        name: 'Partial', startMonth: '2025-11-01', endMonth: '2027-03-31',
        parameters: { frequency: 'monthly', dayOfMonth: 1, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 12);
      assert.equal(entries[0].date, '2026-01-01');
      assert.equal(entries[11].date, '2026-12-01');
    });

    it('respects own startMonth and endMonth (within simPeriod)', function () {
      const a = {
        name: 'Q1 only', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: { frequency: 'monthly', dayOfMonth: 10, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].date, '2026-01-10');
      assert.equal(entries[2].date, '2026-03-10');
    });
  });

  describe('2) quarterly frequency', function () {
    it('generates 4 entries for a full year', function () {
      const a = {
        name: 'Quarterly review', startMonth: '2026-01-01', endMonth: '2026-12-31',
        parameters: { frequency: 'quarterly', dayOfMonth: 15, debitAccount: '5000', creditAccount: '2000', amount: 300000 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 4);
      assert.equal(entries[0].date, '2026-01-15');
      assert.equal(entries[1].date, '2026-04-15');
      assert.equal(entries[2].date, '2026-07-15');
      assert.equal(entries[3].date, '2026-10-15');
    });
  });

  describe('3) yearly frequency', function () {
    it('generates 1 entry per year', function () {
      const a = {
        name: 'Annual bonus', startMonth: '2026-01-01', endMonth: '2026-12-31',
        parameters: { frequency: 'yearly', dayOfMonth: 1, debitAccount: '5000', creditAccount: '2000', amount: 1000000 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].date, '2026-01-01');
    });
  });

  describe('4) day-of-month edge cases', function () {
    it('Feb 31 falls back to Feb 28 (non-leap)', function () {
      const a = {
        name: 'Feb pay', startMonth: '2026-02-01', endMonth: '2026-02-28',
        parameters: { frequency: 'monthly', dayOfMonth: 31, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].date, '2026-02-28'); // 2026 not a leap year
    });

    it('Feb 29 in leap year uses 29', function () {
      const sc = { simPeriodFrom: '2028-01-01', simPeriodTo: '2028-12-31' };
      const a = {
        name: 'Feb leap', startMonth: '2028-02-01', endMonth: '2028-02-29',
        parameters: { frequency: 'monthly', dayOfMonth: 29, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, sc);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].date, '2028-02-29');
    });

    it('Apr 31 falls back to Apr 30', function () {
      const a = {
        name: 'Apr pay', startMonth: '2026-04-01', endMonth: '2026-04-30',
        parameters: { frequency: 'monthly', dayOfMonth: 31, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].date, '2026-04-30');
    });
  });

  describe('5) increase rule', function () {
    it('percent increase compounds monthly', function () {
      const a = {
        name: 'Growing rent', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          frequency: 'monthly', dayOfMonth: 1,
          debitAccount: '5000', creditAccount: '2000', amount: 1000,
          increaseRule: { type: 'percent', value: 10 },
        },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].creditAmount, 1000);     // month 1: base
      assert.equal(entries[1].creditAmount, 1100);     // month 2: 1000 * 1.10
      assert.equal(entries[2].creditAmount, 1210);     // month 3: 1000 * 1.10^2 = 1210
    });

    it('fixed increase adds each period', function () {
      const a = {
        name: 'Stepped', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          frequency: 'monthly', dayOfMonth: 1,
          debitAccount: '5000', creditAccount: '2000', amount: 1000,
          increaseRule: { type: 'fixed', value: 200 },
        },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].creditAmount, 1000);
      assert.equal(entries[1].creditAmount, 1200);
      assert.equal(entries[2].creditAmount, 1400);
    });

    it('first entry always base amount (no increase on month 1)', function () {
      const a = {
        name: 'First base', startMonth: '2026-01-01', endMonth: '2026-06-30',
        parameters: {
          frequency: 'monthly', dayOfMonth: 1,
          debitAccount: '5000', creditAccount: '2000', amount: 500,
          increaseRule: { type: 'percent', value: 50 },
        },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.equal(entries[0].creditAmount, 500);
    });
  });

  describe('6) invariants', function () {
    it('every entry has debit == credit', function () {
      const a = {
        name: 'Check balance', startMonth: '2026-01-01', endMonth: '2026-12-31',
        parameters: {
          frequency: 'monthly', dayOfMonth: 25,
          debitAccount: '5000', creditAccount: '2000', amount: 1234.56,
          increaseRule: { type: 'percent', value: 3 },
        },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      assert.ok(entries.length > 0);
      for (const e of entries) {
        assert.equal(e.debitAmount, e.creditAmount, `entry ${e.date} not balanced: ${e.debitAmount} vs ${e.creditAmount}`);
      }
    });

    it('all entries are within scenario date bounds', function () {
      const a = {
        name: 'Bounded', startMonth: '2026-01-01', endMonth: '2026-12-31',
        parameters: { frequency: 'monthly', dayOfMonth: 1, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      for (const e of entries) {
        assert.ok(e.date >= SCENARIO.simPeriodFrom, `${e.date} before ${SCENARIO.simPeriodFrom}`);
        assert.ok(e.date <= SCENARIO.simPeriodTo, `${e.date} after ${SCENARIO.simPeriodTo}`);
      }
    });

    it('all entries have sourceType recurring', function () {
      const a = {
        name: 'Source check', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: { frequency: 'monthly', dayOfMonth: 1, debitAccount: '5000', creditAccount: '2000', amount: 100 },
      };
      const entries = generateRecurringEntries(a, SCENARIO);
      for (const e of entries) {
        assert.equal(e.sourceType, 'recurring');
      }
    });
  });
});
