'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Translations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tableName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Target table name (e.g. AccountClass, CompanyClass)'
      },
      recordKey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Logical record key within the table (e.g. account code, slug, or composite key)'
      },
      field: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Translatable column name (e.g. name, label, title)'
      },
      language: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: 'ISO 639-1 language code (ja, vi, en)'
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Translation text'
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'NULL = system-wide (shared seed); non-NULL = tenant override'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Unique: one translation per (table, record, field, language, tenant)
    // PostgreSQL partial unique: when tenantId IS NULL
    await queryInterface.addIndex('Translations', ['tableName', 'recordKey', 'field', 'language'], {
      unique: true,
      where: { tenantId: null },
      name: 'translations_system_unique'
    });
    // When tenantId IS NOT NULL
    await queryInterface.addIndex('Translations', ['tableName', 'recordKey', 'field', 'language', 'tenantId'], {
      unique: true,
      where: { tenantId: { [Sequelize.Op.ne]: null } },
      name: 'translations_tenant_unique'
    });

    // Fast lookups
    await queryInterface.addIndex('Translations', ['tableName', 'language'], {
      name: 'translations_table_lang_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Translations');
  }
};
