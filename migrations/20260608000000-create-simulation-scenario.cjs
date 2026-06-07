'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SimulationScenarios', {
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
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      baseTerm: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      basePeriodFrom: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      basePeriodTo: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      simPeriodFrom: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      simPeriodTo: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'draft'
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      visibility: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'private'
      },
      lockedAt: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      lockedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('SimulationScenarios', ['tenantId', 'status'], {
      name: 'simulation_scenarios_tenant_status_idx'
    });
    await queryInterface.addIndex('SimulationScenarios', ['tenantId', 'ownerId'], {
      name: 'simulation_scenarios_tenant_owner_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SimulationScenarios');
  }
};
