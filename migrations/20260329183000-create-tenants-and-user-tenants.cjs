'use strict';

const LEGACY_TENANT_SLUG = 'default';
const LEGACY_TENANT_NAME = 'Default Tenant';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tenants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('Tenants', ['status']);

    await queryInterface.createTable('UserTenants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'member'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      accounting: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      fiscalBrowsing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      approvable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      administrable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      companyManagement: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      inventoryManagement: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      personnelManagement: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addConstraint('UserTenants', {
      fields: ['userId', 'tenantId'],
      type: 'unique',
      name: 'UserTenants_userId_tenantId_key'
    });
    await queryInterface.addIndex('UserTenants', ['userId']);
    await queryInterface.addIndex('UserTenants', ['tenantId']);
    await queryInterface.addIndex('UserTenants', ['userId', 'isDefault']);

    await queryInterface.addColumn('Members', 'tenantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Tenants',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    await queryInterface.addIndex('Members', ['tenantId']);
    await queryInterface.sequelize.query('ALTER TABLE "Members" DROP CONSTRAINT IF EXISTS "Members_userId_key";');
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "Members_tenantId_userId_key" ON "Members" ("tenantId", "userId") WHERE "userId" IS NOT NULL;'
    );

    const now = new Date();
    await queryInterface.sequelize.query(
      `INSERT INTO "Tenants" ("slug", "name", "status", "createdAt", "updatedAt")
       VALUES (:slug, :name, 'active', :now, :now)
       ON CONFLICT ("slug") DO NOTHING;`,
      {
        replacements: {
          slug: LEGACY_TENANT_SLUG,
          name: LEGACY_TENANT_NAME,
          now
        }
      }
    );

    const [tenants] = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants" WHERE slug = :slug LIMIT 1;',
      {
        replacements: {
          slug: LEGACY_TENANT_SLUG
        }
      }
    );
    const legacyTenantId = tenants[0]?.id;

    if (legacyTenantId) {
      await queryInterface.sequelize.query(
        `INSERT INTO "UserTenants" (
          "userId", "tenantId", "role", "status", "isDefault",
          "accounting", "fiscalBrowsing", "approvable", "administrable",
          "companyManagement", "inventoryManagement", "personnelManagement",
          "createdAt", "updatedAt"
        )
        SELECT
          u.id,
          :tenantId,
          CASE WHEN u.administrable THEN 'owner' ELSE 'member' END,
          'active',
          true,
          COALESCE(u.accounting, false),
          COALESCE(u."fiscalBrowsing", false),
          COALESCE(u.approvable, false),
          COALESCE(u.administrable, false),
          COALESCE(u."companyManagement", false),
          COALESCE(u."inventoryManagement", false),
          COALESCE(u."personnelManagement", false),
          :now,
          :now
        FROM "Users" u
        ON CONFLICT ("userId", "tenantId") DO NOTHING;`,
        {
          replacements: {
            tenantId: legacyTenantId,
            now
          }
        }
      );

      await queryInterface.sequelize.query(
        'UPDATE "Members" SET "tenantId" = :tenantId WHERE "tenantId" IS NULL;',
        {
          replacements: {
            tenantId: legacyTenantId
          }
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "Members_tenantId_userId_key";');
    await queryInterface.addConstraint('Members', {
      fields: ['userId'],
      type: 'unique',
      name: 'Members_userId_key'
    });
    await queryInterface.removeIndex('Members', ['tenantId']);
    await queryInterface.removeColumn('Members', 'tenantId');

    await queryInterface.removeIndex('UserTenants', ['userId', 'isDefault']);
    await queryInterface.removeIndex('UserTenants', ['tenantId']);
    await queryInterface.removeIndex('UserTenants', ['userId']);
    await queryInterface.removeConstraint('UserTenants', 'UserTenants_userId_tenantId_key');
    await queryInterface.dropTable('UserTenants');

    await queryInterface.removeIndex('Tenants', ['status']);
    await queryInterface.dropTable('Tenants');
  }
};
