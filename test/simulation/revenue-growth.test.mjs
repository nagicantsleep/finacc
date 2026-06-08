/**
 * Revenue growth generator — Issue #265 (E3.4).
 *
 * Verifies percent/fixed/manual/avg_last_3m/last_month growth types,
 * collection timing offset, debit==credit invariant.
 */

import { strict as assert } from 'node:assert';
import { generateRevenueGrowthEntries } from '../../libs/simulation/assumption-generator.js';

const SCENARIO = { simPeriodFrom: '2026-01-01', simPeriodTo: '2026-12-31' };

describe('Simulation — E3.4 revenue_growth generator', function () {
  describe('1) percent growth', function () {
    it('compounds monthly from base', function () {
      const a = {
        name: 'Percent growth', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          growthType: 'percent', growthValue: 100000, growthRate: 10,
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      // 3 months: 100000, 110000, 121000 (each rounded)
      assert.equal(entries.length, 3);
      assert.equal(entries[0].creditAmount, 100000);
      assert.equal(entries[1].creditAmount, 110000);
      assert.equal(entries[2].creditAmount, 121000);
    });
  });

  describe('2) fixed growth', function () {
    it('adds increment per month', function () {
      const a = {
        name: 'Fixed growth', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          growthType: 'fixed', growthValue: 500000, increment: 50000,
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].creditAmount, 500000);
      assert.equal(entries[1].creditAmount, 550000);
      assert.equal(entries[2].creditAmount, 600000);
    });
  });

  describe('3) manual array', function () {
    it('uses exact array values', function () {
      const a = {
        name: 'Manual', startMonth: '2026-01-01', endMonth: '2026-03-31',
        parameters: {
          growthType: 'manual', growthValue: [200000, 300000, 250000],
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      assert.equal(entries.length, 3);
      assert.equal(entries[0].creditAmount, 200000);
      assert.equal(entries[1].creditAmount, 300000);
      assert.equal(entries[2].creditAmount, 250000);
    });
  });

  describe('4) avg_last_3m', function () {
    it('averages last 3 prior revenues', function () {
      const a = {
        name: 'Avg3m', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          growthType: 'avg_last_3m', growthValue: 0,
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const prior = [100000, 120000, 110000]; // avg = 110000
      const entries = generateRevenueGrowthEntries(a, SCENARIO, prior);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].creditAmount, 110000);
    });
  });

  describe('5) last_month', function () {
    it('repeats last prior month', function () {
      const a = {
        name: 'LastMo', startMonth: '2026-01-01', endMonth: '2026-02-28',
        parameters: {
          growthType: 'last_month', growthValue: 0,
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const prior = [50000, 60000, 55000]; // last = 55000
      const entries = generateRevenueGrowthEntries(a, SCENARIO, prior);
      assert.equal(entries.length, 2);
      assert.equal(entries[0].creditAmount, 55000);
      assert.equal(entries[1].creditAmount, 55000);
    });
  });

  describe('6) collection timing (cash entry)', function () {
    it('offsets cash by collectionTimingDays', function () {
      const a = {
        name: 'Timing', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          growthType: 'percent', growthValue: 100000, growthRate: 0,
          revenueAccount: '4000', counterAccount: '1200',
          collectionTimingDays: 30,
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      // 1 accrual + 1 cash entry
      assert.equal(entries.length, 2);
      assert.equal(entries[0].date, '2026-01-01');
      assert.equal(entries[0].creditAccount, '4000'); // revenue
      assert.equal(entries[1].date, '2026-01-31');
      assert.equal(entries[1].debitAccount, '1000'); // cash
    });

    it('no cash entry when timingDays = 0', function () {
      const a = {
        name: 'No timing', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          growthType: 'percent', growthValue: 100000, growthRate: 0,
          revenueAccount: '4000', counterAccount: '1200',
          collectionTimingDays: 0,
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].creditAccount, '4000');
    });

    it('cash date not pushed outside scenario range', function () {
      const a = {
        name: 'Dec timing', startMonth: '2026-12-01', endMonth: '2026-12-31',
        parameters: {
          growthType: 'percent', growthValue: 100000, growthRate: 0,
          revenueAccount: '4000', counterAccount: '1200',
          collectionTimingDays: 60, // pushes to 2026-13-30 → out of bounds
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      // accrual still in range; cash pushed out — only 1 accrual entry
      assert.equal(entries.length, 1);
      assert.equal(entries[0].creditAccount, '4000');
    });
  });

  describe('7) invariants', function () {
    it('every entry debits == credits', function () {
      const a = {
        name: 'Balance check', startMonth: '2026-01-01', endMonth: '2026-06-30',
        parameters: {
          growthType: 'percent', growthValue: 100000, growthRate: 5,
          revenueAccount: '4000', counterAccount: '1200',
          collectionTimingDays: 30,
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      assert.ok(entries.length > 0);
      for (const e of entries) {
        assert.equal(e.debitAmount, e.creditAmount,
          `entry ${e.date} not balanced: ${e.debitAmount} vs ${e.creditAmount}`);
      }
    });

    it('all entries have sourceType formula', function () {
      const a = {
        name: 'Source check', startMonth: '2026-01-01', endMonth: '2026-01-31',
        parameters: {
          growthType: 'fixed', growthValue: 100000, increment: 0,
          revenueAccount: '4000', counterAccount: '1200',
        },
      };
      const entries = generateRevenueGrowthEntries(a, SCENARIO);
      for (const e of entries) {
        assert.equal(e.sourceType, 'formula');
      }
    });
  });
});
