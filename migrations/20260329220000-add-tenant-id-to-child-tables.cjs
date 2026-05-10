'use strict';

const LEGACY_TENANT_SLUG = 'default';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [tenants] = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants" WHERE slug = :slug LIMIT 1;',
      { replacements: { slug: LEGACY_TENANT_SLUG } }
    );
    const legacyTenantId = tenants[0]?.id ?? null;

    // Helper: add tenantId, backfill from parent, add index
    const addTenantIdDirect = async (table) => {
      await queryInterface.addColumn(table, 'tenantId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tenants', field: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
      await queryInterface.addIndex(table, ['tenantId']);
      if (legacyTenantId) {
        await queryInterface.sequelize.query(
          `UPDATE "${table}" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
          { replacements: { tenantId: legacyTenantId } }
        );
      }
    };

    // TransactionDetails — backfill from TransactionDocuments
    await queryInterface.addColumn('TransactionDetails', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('TransactionDetails', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "TransactionDetails" td
       SET "tenantId" = td2."tenantId"
       FROM "TransactionDocuments" td2
       WHERE td."transactionDocumentId" = td2.id AND td."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "TransactionDetails" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // TaskDetails — backfill from Tasks
    await queryInterface.addColumn('TaskDetails', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('TaskDetails', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "TaskDetails" td
       SET "tenantId" = t."tenantId"
       FROM "Tasks" t
       WHERE td."taskId" = t.id AND td."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "TaskDetails" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // CrossSlipDetails — backfill from CrossSlips
    await queryInterface.addColumn('CrossSlipDetails', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('CrossSlipDetails', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "CrossSlipDetails" csd
       SET "tenantId" = cs."tenantId"
       FROM "CrossSlips" cs
       WHERE csd."crossSlipId" = cs.id AND csd."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "CrossSlipDetails" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // VoucherFiles — backfill from Vouchers
    await queryInterface.addColumn('VoucherFiles', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('VoucherFiles', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "VoucherFiles" vf
       SET "tenantId" = v."tenantId"
       FROM "Vouchers" v
       WHERE vf."voucherId" = v.id AND vf."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "VoucherFiles" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // DocumentFiles — backfill from Documents
    await queryInterface.addColumn('DocumentFiles', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('DocumentFiles', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "DocumentFiles" df
       SET "tenantId" = d."tenantId"
       FROM "Documents" d
       WHERE df."documentId" = d.id AND df."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "DocumentFiles" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // ProjectLabels — backfill from Projects
    await queryInterface.addColumn('ProjectLabels', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('ProjectLabels', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "ProjectLabels" pl
       SET "tenantId" = p."tenantId"
       FROM "Projects" p
       WHERE pl."projectId" = p.id AND pl."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "ProjectLabels" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // LabelAccounts — backfill from Labels
    await queryInterface.addColumn('LabelAccounts', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Tenants', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('LabelAccounts', ['tenantId']);
    await queryInterface.sequelize.query(
      `UPDATE "LabelAccounts" la
       SET "tenantId" = l."tenantId"
       FROM "Labels" l
       WHERE la."labelId" = l.id AND la."tenantId" IS NULL;`
    );
    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `UPDATE "LabelAccounts" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;`,
        { replacements: { tenantId: legacyTenantId } }
      );
    }

    // Create Stickies table (no prior migration)
    await queryInterface.createTable('Stickies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tenants', field: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('Stickies', ['tenantId']);

    // Create StickyStatuses table (no prior migration)
    await queryInterface.createTable('StickyStatuses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tenants', field: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      stickyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Stickies', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      showHide: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      importance: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      posX: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      posY: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('StickyStatuses', ['tenantId']);
    await queryInterface.addIndex('StickyStatuses', ['stickyId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StickyStatuses');
    await queryInterface.dropTable('Stickies');

    for (const table of [
      'LabelAccounts',
      'ProjectLabels',
      'DocumentFiles',
      'VoucherFiles',
      'CrossSlipDetails',
      'TaskDetails',
      'TransactionDetails',
    ]) {
      await queryInterface.removeIndex(table, ['tenantId']);
      await queryInterface.removeColumn(table, 'tenantId');
    }
  },
};
