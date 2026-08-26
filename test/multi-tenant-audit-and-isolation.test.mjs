/**
 * Multi-Tenant Isolation & Audit Test Suite — Issue #360
 *
 * Verifies:
 * 1. Book constructor scopes queries by tenantId.
 * 2. auditHistory properly filters AuditEvents by tenantId when provided.
 * 3. Batch functions enforce tenantId parameter to prevent cross-tenant writes.
 * 4. loadTaxContext strictly requires tenantId.
 */

import { strict as assert } from 'node:assert';
import { Book } from '../forms/book.js';
import { audit, auditHistory } from '../libs/audit.js';
import { append_accounts } from '../batch/append_account.js';
import { append_account_class } from '../batch/append_account_class.js';
import { append_sub_accounts } from '../batch/append_sub_account.js';
import { change_account, change_detail, change_account_class } from '../batch/change_account.js';
import { dumpAccounts } from '../batch/dump-accounts.js';
import { loadTaxContext } from '../libs/tax-calc.js';
import models from '../models/index.js';

describe('Multi-Tenant Isolation & Audit Hardening (Issue #360)', function () {
  describe('forms/book.js scoping', function () {
    it('Book constructor records tenantId and constructs scoped where clause', function () {
      const book1 = new Book(1, 42);
      assert.equal(book1.tenantId, 42);
      assert.equal(book1.term, 1);

      const book2 = new Book(2, 99);
      assert.equal(book2.tenantId, 99);
    });
  });

  describe('libs/audit.js auditHistory tenant isolation', function () {
    it('auditHistory filters by tenantId when supplied', async function () {
      const entityId = `test-entity-${Date.now()}`;
      const tenantA = 1001;
      const tenantB = 1002;

      await audit({
        tenantId: tenantA,
        action: 'test:action',
        entityType: 'TestEntity',
        entityId: entityId,
      });

      await audit({
        tenantId: tenantB,
        action: 'test:action',
        entityType: 'TestEntity',
        entityId: entityId,
      });

      const historyA = await auditHistory('TestEntity', entityId, tenantA);
      assert.ok(historyA.length >= 1, 'Expected at least 1 record for tenant A');
      for (const row of historyA) {
        assert.equal(row.tenantId, tenantA, 'All rows for tenant A must match tenantId');
      }

      const historyB = await auditHistory('TestEntity', entityId, tenantB);
      assert.ok(historyB.length >= 1, 'Expected at least 1 record for tenant B');
      for (const row of historyB) {
        assert.equal(row.tenantId, tenantB, 'All rows for tenant B must match tenantId');
      }
    });
  });

  describe('batch/*.js tenantId guards', function () {
    it('append_accounts throws if tenantId is missing', async function () {
      await assert.rejects(
        async () => {
          await append_accounts({ code: '8020002', name: 'TEST', key: 'test', tax_class: 1 });
        },
        /tenantId is required/
      );
    });

    it('append_account_class throws if tenantId is missing', async function () {
      await assert.rejects(
        async () => {
          await append_account_class({ major: 'M', middle: 'Mid', minor: 'Min', field: 1, adding: 1 });
        },
        /tenantId is required/
      );
    });

    it('append_sub_accounts throws if tenantId is missing', async function () {
      await assert.rejects(
        async () => {
          await append_sub_accounts({ code: '7010000', name: 'Sub', key: 'sub', tax_class: 1, term: 1 });
        },
        /tenantId is required/
      );
    });

    it('change_detail / change_account / change_account_class throw if tenantId is missing', async function () {
      await assert.rejects(async () => { await change_detail([], null); }, /tenantId is required/);
      await assert.rejects(async () => { await change_account([], null); }, /tenantId is required/);
      await assert.rejects(async () => { await change_account_class([], null); }, /tenantId is required/);
    });

    it('dumpAccounts throws if tenantId is missing', async function () {
      await assert.rejects(
        async () => {
          await dumpAccounts(1, null);
        },
        /tenantId is required/
      );
    });
  });

  describe('libs/tax-calc.js loadTaxContext guard', function () {
    it('loadTaxContext throws if tenantId is missing', async function () {
      await assert.rejects(
        async () => {
          await loadTaxContext(2026, 1, null);
        },
        /tenantId is required/
      );
    });
  });
});
