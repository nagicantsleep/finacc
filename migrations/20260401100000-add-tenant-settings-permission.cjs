'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TenantMembers', 'tenantSettings', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Permission to access /tenant settings page'
    });

    // Grant tenantSettings to all existing owners
    await queryInterface.sequelize.query(
      `UPDATE "TenantMembers" SET "tenantSettings" = true WHERE "isOwner" = true`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('TenantMembers', 'tenantSettings');
  }
};
