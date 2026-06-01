'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // TenantMember already has tenantSettings BOOLEAN from a prior migration;
    // add languagePair JSONB for per-user language pair override
    await queryInterface.addColumn('TenantMembers', 'languagePair', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'User-level language pair override. Null = inherit tenant default. e.g. {"primary":"ja","secondary":"vi"}'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TenantMembers', 'languagePair');
  }
};
