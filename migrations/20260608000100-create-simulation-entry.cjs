'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SimulationEntries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      scenarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'SimulationScenarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      debitAccount: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      debitSubAccount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      debitAmount: {
        type: Sequelize.DECIMAL(12),
        allowNull: false
      },
      creditAccount: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      creditSubAccount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      creditAmount: {
        type: Sequelize.DECIMAL(12),
        allowNull: false
      },
      taxRuleId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      labelId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      memo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      sourceType: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'manual'
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
    await queryInterface.addIndex('SimulationEntries', ['scenarioId'], {
      name: 'simulation_entries_scenario_idx'
    });
    await queryInterface.addIndex('SimulationEntries', ['tenantId'], {
      name: 'simulation_entries_tenant_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SimulationEntries');
  }
};
