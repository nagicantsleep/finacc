import { assert } from 'chai';
import models from '../models/index.js';
import {
  round,
  computeTax,
  findTaxRule,
  findAccount,
  normalizeLines,
  loadTaxContext,
  computeLineTaxes,
  makeTaxLine,
  recalcSlipLines,
  validateDay,
  validateLines,
  validateBalanced,
  computeVoucherTax
} from '../src/lib/server/tax-calc.js';

const ctx = {
  fy: { term: 1, taxIncluded: false },
  accounts: [
    { code: '1000001', taxClass: 0 },
    { code: '6000001', taxClass: 2 },
    { code: '7000001', taxClass: 2 }
  ],
  taxRules: [
    { id: 1, label: '10%外税', taxClass: 2, rate: 10 },
    { id: 2, label: '10%内税', taxClass: 1, rate: 10 },
    { id: 3, label: '非課税', taxClass: 0, rate: 0 }
  ],
  roundingMethod: 2
};

describe('tax-calc unit & multi-tenant tests', () => {
  describe('round method', () => {
    it('method 0: floor (切り捨て)', () => {
      assert.equal(round(10.9, 0), 10);
      assert.equal(round(10.1, 0), 10);
    });

    it('method 1: ceil (切り上げ)', () => {
      assert.equal(round(10.1, 1), 11);
      assert.equal(round(10.0, 1), 10);
    });

    it('method 2: round (四捨五入)', () => {
      assert.equal(round(10.4, 2), 10);
      assert.equal(round(10.5, 2), 11);
    });
  });

  describe('computeLineTaxes', () => {
    it('外税: 借方金額10000に対して税額1000を計算する', () => {
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 10000,
          debitTaxRuleId: 1,
          creditAccount: '1000001',
          creditAmount: 11000
        }
      ];
      const result = computeLineTaxes(lines, ctx);
      assert.equal(result[0].debitTax, 1000);
      assert.equal(result[0].creditTax, 0);
    });

    it('内税: 税込11000から税額1000を内部計算する', () => {
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 11000,
          debitTaxRuleId: 2,
          creditAccount: '1000001',
          creditAmount: 11000
        }
      ];
      const result = computeLineTaxes(lines, ctx);
      assert.equal(result[0].debitTax, 1000);
    });

    it('税込方式(taxIncluded)では税額が0になる', () => {
      const includedCtx = { ...ctx, fy: { term: 1, taxIncluded: true } };
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 11000,
          debitTaxRuleId: 2,
          creditAccount: '1000001',
          creditAmount: 11000
        }
      ];
      const result = computeLineTaxes(lines, includedCtx);
      assert.equal(result[0].debitTax, 0);
      assert.equal(result[0].creditTax, 0);
    });

    it('売上(収益)の貸方税は仮受消費税(3080000)行を生成し貸借が一致する', () => {
      const lines = [
        {
          debitAccount: '1000001',
          debitAmount: 11000,
          creditAccount: '6000001',
          creditAmount: 10000,
          creditTaxRuleId: 1
        }
      ];
      const result = makeTaxLine(computeLineTaxes(lines, ctx), ctx);
      const debit = result.reduce((s, l) => s + l.debitAmount, 0);
      const credit = result.reduce((s, l) => s + l.creditAmount, 0);
      assert.equal(debit, credit);
      const taxLine = result.find((l) => l.creditAccount === '3080000');
      assert.ok(taxLine);
      assert.equal(taxLine.creditAmount, 1000);
    });

    it('仕入(費用)の借方税は仮払消費税(1140000)行を生成し貸借が一致する', () => {
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 10000,
          debitTaxRuleId: 1,
          creditAccount: '1000001',
          creditAmount: 11000
        }
      ];
      const result = makeTaxLine(computeLineTaxes(lines, ctx), ctx);
      const debit = result.reduce((s, l) => s + l.debitAmount, 0);
      const credit = result.reduce((s, l) => s + l.creditAmount, 0);
      assert.equal(debit, credit);
      const taxLine = result.find((l) => l.debitAccount === '1140000');
      assert.ok(taxLine);
      assert.equal(taxLine.debitAmount, 1000);
    });
  });

  describe('normalizeLines', () => {
    it('sundriesをnullに変換し数値化する', () => {
      const lines = [
        {
          debitAccount: 'sundries',
          debitAmount: '1,000',
          creditAccount: '1000001',
          creditAmount: '1000'
        }
      ];
      const result = normalizeLines(lines);
      assert.equal(result[0].debitAccount, null);
      assert.equal(result[0].debitAmount, 1000);
    });
  });

  describe('validateDay', () => {
    it('0と32を拒否する', () => {
      assert.ok(validateDay(2026, 3, 0));
      assert.ok(validateDay(2026, 3, 32));
    });
    it('1..31は許容する', () => {
      assert.equal(validateDay(2026, 3, 1), null);
      assert.equal(validateDay(2026, 3, 31), null);
    });
  });

  describe('validateLines', () => {
    it('金額のある行に科目が無い場合エラー', () => {
      const lines = [{ debitAmount: 1000, creditAmount: 1000, creditAccount: '1000001' }];
      assert.ok(validateLines(lines, ctx));
    });
    it('未登録の勘定科目を拒否する', () => {
      const lines = [
        {
          debitAccount: '9999999',
          debitAmount: 1000,
          creditAccount: '1000001',
          creditAmount: 1000
        }
      ];
      assert.ok(validateLines(lines, ctx));
    });
    it('正常な行は許容する', () => {
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 1000,
          creditAccount: '1000001',
          creditAmount: 1000
        }
      ];
      assert.equal(validateLines(lines, ctx), null);
    });
  });

  describe('validateBalanced', () => {
    it('貸借不一致はエラー', () => {
      const lines = [{ debitAmount: 1000, creditAmount: 900 }];
      assert.ok(validateBalanced(lines));
    });
    it('一致は許容する', () => {
      const lines = [{ debitAmount: 1000, creditAmount: 1000 }];
      assert.equal(validateBalanced(lines), null);
    });
  });

  describe('computeVoucherTax', () => {
    it('外税10%で10000円なら1000円', () => {
      assert.equal(computeVoucherTax(10000, 1, ctx), 1000);
    });
  });

  describe('loadTaxContext with multi-tenant DB', () => {
    let tenantA, tenantB;
    before(async () => {
      tenantA = await models.Tenant.create({
        slug: `tax-t-a-${Date.now()}`,
        name: 'Tax Tenant A',
        status: 'active',
        settings: { companyName: 'Tenant A Co', roundingMethod: 0 }
      });
      tenantB = await models.Tenant.create({
        slug: `tax-t-b-${Date.now()}`,
        name: 'Tax Tenant B',
        status: 'active',
        settings: { companyName: 'Tenant B Co', roundingMethod: 1 }
      });

      await models.FiscalYear.create({
        tenantId: tenantA.id,
        term: 1,
        year: 2026,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        taxIncluded: false,
        transactionCount: 0
      });

      await models.Account.create({
        tenantId: tenantA.id,
        accountCode: '7110001',
        name: 'Chi phí văn phòng A',
        taxClass: 2
      });

      await models.TaxRule.create({
        tenantId: tenantA.id,
        label: '10% VAT',
        rate: 10,
        taxClass: 2,
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      });
    });

    after(async () => {
      if (tenantA) {
        await models.TaxRule.destroy({ where: { tenantId: tenantA.id } });
        await models.Account.destroy({ where: { tenantId: tenantA.id } });
        await models.FiscalYear.destroy({ where: { tenantId: tenantA.id } });
        await tenantA.destroy();
      }
      if (tenantB) {
        await tenantB.destroy();
      }
    });

    it('loads context specifically scoped to tenantA', async () => {
      const ctxA = await loadTaxContext(2026, 5, tenantA.id);
      assert.ok(ctxA.fy);
      assert.equal(ctxA.fy.term, 1);
      assert.equal(ctxA.roundingMethod, 0);
      assert.ok(ctxA.accounts.some((a) => a.code === '7110001'));
      assert.ok(ctxA.taxRules.some((r) => r.label === '10% VAT'));

      // Tenant B should have empty/default context
      const ctxB = await loadTaxContext(2026, 5, tenantB.id);
      assert.equal(ctxB.fy, null);
      assert.equal(ctxB.roundingMethod, 1);
      assert.equal(ctxB.accounts.length, 0);
    });
  });
});
