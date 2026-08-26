import { assert } from 'chai';
import { validateDay, validateLines } from '../ai/mcp/voucher-mcp/validate.js';
import { previewSlip } from '../ai/mcp/voucher-mcp/tax.js';
import { toolDefinitions } from '../ai/mcp/voucher-mcp/definitions.js';
import { handlers } from '../ai/mcp/voucher-mcp/handlers.js';

describe('AI Voucher MCP Server & Utilities', () => {
  describe('1. Validation Helpers', () => {
    it('validateDay rejects invalid days and accepts valid days', () => {
      assert.ok(validateDay(2026, 3, 0));
      assert.ok(validateDay(2026, 3, 32));
      assert.ok(validateDay(2026, 3, null));
      assert.equal(validateDay(2026, 3, 1), null);
      assert.equal(validateDay(2026, 3, 31), null);
    });

    it('validateLines validates required accounts', () => {
      assert.ok(validateLines([]));
      assert.ok(validateLines([{ debitAmount: 1000, debitAccount: null, creditAmount: 1000, creditAccount: '1000001' }]));
      assert.ok(validateLines([{ debitAmount: 1000, debitAccount: '7000001', creditAmount: 1000, creditAccount: null }]));
      assert.equal(validateLines([{ debitAmount: 1000, debitAccount: '7000001', creditAmount: 1000, creditAccount: '1000001' }]), null);
    });
  });

  describe('2. MCP Tax Calculation Preview', () => {
    it('previewSlip generates automatic tax line for external 10% tax', () => {
      const lines = [
        {
          debitAccount: '7000001',
          debitAmount: 10000,
          debitTaxRuleId: 7,
          creditAccount: '1000001',
          creditAmount: 11000
        }
      ];

      const ctx = {
        fy: { taxIncluded: false },
        taxRules: [
          { id: 7, taxClass: 2, rate: 10 }
        ],
        roundingMethod: 0
      };

      const preview = previewSlip(lines, ctx);
      assert.equal(preview.length, 2);
      assert.equal(preview[1].debitAccount, '1140000');
      assert.equal(preview[1].debitAmount, 1000);
    });
  });

  describe('3. MCP Definitions and Handler Parity', () => {
    it('exports all 19 MCP tool definitions', () => {
      assert.equal(toolDefinitions.length, 19);
      const toolNames = toolDefinitions.map(t => t.name);
      assert.includeMembers(toolNames, [
        'get_accounts',
        'get_companies',
        'get_voucher_classes',
        'get_tax_rules',
        'get_fiscal_year',
        'get_journal',
        'get_cross_slip',
        'list_cross_slips',
        'list_vouchers',
        'create_cross_slip',
        'update_cross_slip',
        'approve_cross_slip',
        'disapprove_cross_slip',
        'delete_cross_slip',
        'create_voucher',
        'create_voucher_with_file',
        'update_voucher',
        'delete_voucher',
        'compute_slip_taxes'
      ]);
    });

    it('each tool definition has a corresponding handler in handlers.js', () => {
      for (const tool of toolDefinitions) {
        assert.isFunction(handlers[tool.name], `handler for ${tool.name} must be a function`);
      }
    });
  });
});
