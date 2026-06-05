'use strict';

/**
 * Move languagePair storage from (user, tenant) level to USER level.
 *
 * Rationale: language is a property of the person, not the company. A tenant
 * with multi-national staff should not impose one language; and the same
 * person across two tenants should keep one language. So the preference
 * belongs on Users, independent of any tenant.
 *
 * up:   add Users.languagePair (JSONB, nullable), migrate any existing
 *       TenantMember preference onto its user (first non-null wins), then
 *       drop TenantMembers.languagePair.
 * down: re-add TenantMembers.languagePair and copy the user value back onto
 *       every active membership, then drop Users.languagePair.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'languagePair', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'User-level language pair preference. Null = system default {ja,vi}. e.g. {"primary":"ja","secondary":"vi"}'
    });

    // Migrate existing per-membership preference onto the user.
    // For users with several memberships carrying a pair, the lowest member id wins.
    await queryInterface.sequelize.query(`
      UPDATE "Users" u
      SET "languagePair" = sub."languagePair"
      FROM (
        SELECT DISTINCT ON ("userId") "userId", "languagePair"
        FROM "TenantMembers"
        WHERE "languagePair" IS NOT NULL AND "userId" IS NOT NULL
        ORDER BY "userId", "id" ASC
      ) sub
      WHERE u."id" = sub."userId";
    `);

    await queryInterface.removeColumn('TenantMembers', 'languagePair');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('TenantMembers', 'languagePair', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'User-level language pair override. Null = inherit tenant default. e.g. {"primary":"ja","secondary":"vi"}'
    });

    // Copy user preference back onto active memberships.
    await queryInterface.sequelize.query(`
      UPDATE "TenantMembers" m
      SET "languagePair" = u."languagePair"
      FROM "Users" u
      WHERE m."userId" = u."id" AND u."languagePair" IS NOT NULL;
    `);

    await queryInterface.removeColumn('Users', 'languagePair');
  }
};
