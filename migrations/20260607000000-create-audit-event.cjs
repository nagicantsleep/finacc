'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditEvents', {
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
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      term: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payload: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex('AuditEvents', ['tenantId', 'action', 'createdAt'], {
      name: 'audit_events_tenant_action_created_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuditEvents');
  }
};
