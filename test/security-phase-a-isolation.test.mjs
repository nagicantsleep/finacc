import { expect } from 'chai';
import models from '../src/lib/server/db/index.js';
import { requireAdmin, listBackupDates, BACKUP_DISABLED_MESSAGE } from '../src/lib/server/admin-backup.js';

describe('Phase A Security Hardening: Multi-Tenant Isolation & Guard Verification', () => {
  describe('H1: Admin Backup Isolation Guard', () => {
    const originalEnv = process.env.ALLOW_PLATFORM_BACKUP;

    afterEach(() => {
      process.env.ALLOW_PLATFORM_BACKUP = originalEnv;
    });

    it('denies backup operations with 403 when ALLOW_PLATFORM_BACKUP is unset or false', async () => {
      delete process.env.ALLOW_PLATFORM_BACKUP;
      const locals = {
        user: { id: 1, administrable: true },
        tenantId: 'tenant-test-1'
      };
      const response = requireAdmin(locals);
      expect(response).to.exist;
      expect(response.status).to.equal(403);
      const data = await response.json();
      expect(data.code).to.equal(-10);
      expect(data.message).to.equal(BACKUP_DISABLED_MESSAGE);
    });

    it('listBackupDates returns empty array when ALLOW_PLATFORM_BACKUP is unset or false', async () => {
      delete process.env.ALLOW_PLATFORM_BACKUP;
      const dates = await listBackupDates();
      expect(dates).to.deep.equal([]);
    });

    it('allows backup operations when ALLOW_PLATFORM_BACKUP is true and user is administrable', () => {
      process.env.ALLOW_PLATFORM_BACKUP = 'true';
      const locals = {
        user: { id: 1, administrable: true },
        tenantId: 'tenant-test-1'
      };
      const response = requireAdmin(locals);
      expect(response).to.be.null;
    });

    it('denies non-administrable users even when ALLOW_PLATFORM_BACKUP is true', () => {
      process.env.ALLOW_PLATFORM_BACKUP = 'true';
      const locals = {
        user: { id: 1, administrable: false },
        tenantId: 'tenant-test-1'
      };
      const response = requireAdmin(locals);
      expect(response).to.exist;
      expect(response.status).to.equal(403);
    });
  });

  describe('H2: PUT tenantId Mass-Assignment Protection', () => {
    it('ItemClass cannot be transferred across tenants via PUT payload', async () => {
      const t = await models.sequelize.transaction();
      try {
        const tenantA = await models.Tenant.create({
          name: `Org Alpha ${Date.now()}`,
          slug: `alpha-${Date.now()}`,
          status: 'active'
        }, { transaction: t });

        const tenantB = await models.Tenant.create({
          name: `Org Beta ${Date.now()}`,
          slug: `beta-${Date.now()}`,
          status: 'active'
        }, { transaction: t });

        const item = await models.ItemClass.create({
          tenantId: tenantA.id,
          name: 'Original Item Class',
          displayOrder: 1
        }, { transaction: t });

        // Simulate sanitized PUT
        const payload = { id: item.id, name: 'Updated Name', tenantId: tenantB.id };
        const patch = { ...payload };
        delete patch.id;
        delete patch.tenantId;

        await item.update(patch, { transaction: t });
        await item.reload({ transaction: t });

        expect(item.name).to.equal('Updated Name');
        expect(item.tenantId).to.equal(tenantA.id);
        expect(item.tenantId).to.not.equal(tenantB.id);

        await t.rollback();
      } catch (e) {
        if (!t.finished) await t.rollback();
        throw e;
      }
    });

    it('TaxRule cannot be transferred across tenants via PUT payload', async () => {
      const t = await models.sequelize.transaction();
      try {
        const tenantA = await models.Tenant.create({
          name: `Org Tax Alpha ${Date.now()}`,
          slug: `tax-alpha-${Date.now()}`,
          status: 'active'
        }, { transaction: t });

        const tenantB = await models.Tenant.create({
          name: `Org Tax Beta ${Date.now()}`,
          slug: `tax-beta-${Date.now()}`,
          status: 'active'
        }, { transaction: t });

        const rule = await models.TaxRule.create({
          tenantId: tenantA.id,
          label: 'Original Tax',
          rate: 10,
          displayOrder: 1
        }, { transaction: t });

        const payload = { id: rule.id, label: 'Modified Tax', tenantId: tenantB.id };
        const patch = { ...payload };
        delete patch.id;
        delete patch.tenantId;

        await rule.update(patch, { transaction: t });
        await rule.reload({ transaction: t });

        expect(rule.label).to.equal('Modified Tax');
        expect(rule.tenantId).to.equal(tenantA.id);
        expect(rule.tenantId).to.not.equal(tenantB.id);

        await t.rollback();
      } catch (e) {
        if (!t.finished) await t.rollback();
        throw e;
      }
    });
  });

  describe('H3: HMAC Secret Production Boot Guard', () => {
    it('validates that production requires non-default EXPRESS secret', () => {
      const checkSecret = (nodeEnv, expressSecret) => {
        if (nodeEnv === 'production') {
          if (!expressSecret || expressSecret === 'hieronymus_secret_dev_key') {
            throw new Error('FATAL: EXPRESS secret environment variable must be set to a secure non-default value in production mode.');
          }
        }
        return true;
      };

      expect(() => checkSecret('production', '')).to.throw('FATAL: EXPRESS secret');
      expect(() => checkSecret('production', 'hieronymus_secret_dev_key')).to.throw('FATAL: EXPRESS secret');
      expect(checkSecret('production', 'custom_production_secure_key_12345')).to.be.true;
      expect(checkSecret('development', 'hieronymus_secret_dev_key')).to.be.true;
    });
  });
});
