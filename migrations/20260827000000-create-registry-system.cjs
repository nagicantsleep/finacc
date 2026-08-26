'use strict';

/**
 * Migration: Create Registry System (台帳管理システム)
 * Adds RegistryDefinitions, RegistryEntries, and RegistryTimelines.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // 1. Create RegistryDefinitions
      await queryInterface.createTable(
        'RegistryDefinitions',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          tenantId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Tenants',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          code: {
            type: Sequelize.STRING(50),
            allowNull: false
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          icon: {
            type: Sequelize.STRING(100),
            allowNull: false,
            defaultValue: 'bi-journal-bookmark'
          },
          status: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 'active'
          },
          schema: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: { fields: [] }
          },
          layout: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {}
          },
          displayOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          }
        },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "RegistryDefinitions" ADD CONSTRAINT "registrydefinitions_status_chk" CHECK ("status" IN ('active', 'archived'));`,
        { transaction: t }
      );

      await queryInterface.addIndex(
        'RegistryDefinitions',
        ['tenantId', 'code'],
        {
          unique: true,
          name: 'RegistryDefinitions_tenantId_code_unique',
          transaction: t
        }
      );

      // 2. Create RegistryEntries
      await queryInterface.createTable(
        'RegistryEntries',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          tenantId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Tenants',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          registryDefinitionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'RegistryDefinitions',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          code: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          data: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: {}
          },
          companyId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Companies',
              key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          status: {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: 'open'
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          }
        },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'RegistryEntries',
        ['tenantId', 'registryDefinitionId'],
        {
          name: 'RegistryEntries_tenantId_defId_idx',
          transaction: t
        }
      );

      await queryInterface.addIndex(
        'RegistryEntries',
        ['tenantId', 'companyId'],
        {
          name: 'RegistryEntries_tenantId_companyId_idx',
          transaction: t
        }
      );

      await queryInterface.addIndex(
        'RegistryEntries',
        ['tenantId', 'status'],
        {
          name: 'RegistryEntries_tenantId_status_idx',
          transaction: t
        }
      );

      // 3. Create RegistryTimelines
      await queryInterface.createTable(
        'RegistryTimelines',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          tenantId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Tenants',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          registryEntryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'RegistryEntries',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          action: {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: 'comment'
          },
          comment: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          changes: {
            type: Sequelize.JSONB,
            allowNull: true
          },
          authorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          }
        },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'RegistryTimelines',
        ['tenantId', 'registryEntryId'],
        {
          name: 'RegistryTimelines_tenantId_entryId_idx',
          transaction: t
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('RegistryTimelines', { transaction: t });
      await queryInterface.dropTable('RegistryEntries', { transaction: t });
      await queryInterface.dropTable('RegistryDefinitions', { transaction: t });
    });
  }
};
