'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SimulationAssumptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'CASCADE'
      },
      scenarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'SimulationScenarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      startMonth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endMonth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'active'
      },
      generatedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      generatedHash: {
        type: Sequelize.STRING(64),
        allowNull: true
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
    await queryInterface.addIndex('SimulationAssumptions', ['tenantId', 'scenarioId', 'type'], {
      name: 'simulation_assumptions_tenant_scenario_type_idx'
    });
    await queryInterface.addIndex('SimulationAssumptions', ['scenarioId', 'status'], {
      name: 'simulation_assumptions_scenario_status_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SimulationAssumptions');
  }
};
