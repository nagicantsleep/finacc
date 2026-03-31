'use strict';

/**
 * Merge UserTenant and Member into TenantMember
 *
 * This migration consolidates the UserTenant and Member tables into a single
 * TenantMember table that represents both tenant membership (access rights) and
 * personnel profile.
 *
 * Steps:
 * 1. Add identity columns to Users table: legalName, legalRuby, legalSex, birthDate, email
 * 2. Rename Members table to TenantMembers
 * 3. Add membership columns to TenantMembers: isOwner, isDefault, status, permissions
 * 4. Backfill User.legalName from Members.legalName
 * 5. Copy permissions from UserTenants to TenantMembers
 * 6. Create TenantMember records for users who have UserTenant but no Member
 * 7. Drop UserTenants table
 * 8. Update constraints and indexes
 *
 * Related: Issue #51, redesign-user-tenant-member.md
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================================================
    // STEP 1: Add identity columns to Users table
    // ============================================================
    console.log('Step 1: Adding identity columns to Users table...');
    
    // Add legalName (required)
    const hasLegalName = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'legalName'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasLegalName.length === 0) {
      await queryInterface.addColumn('Users', 'legalName', {
        type: Sequelize.STRING,
        allowNull: true // Temporarily nullable for data migration
      });
    }

    // Add legalRuby (optional)
    const hasLegalRuby = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'legalRuby'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasLegalRuby.length === 0) {
      await queryInterface.addColumn('Users', 'legalRuby', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Add legalSex (optional)
    const hasLegalSex = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'legalSex'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasLegalSex.length === 0) {
      await queryInterface.addColumn('Users', 'legalSex', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    // Add birthDate (optional)
    const hasBirthDate = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'birthDate'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasBirthDate.length === 0) {
      await queryInterface.addColumn('Users', 'birthDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
    }

    // Add email (will be required)
    const hasEmail = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'email'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasEmail.length === 0) {
      await queryInterface.addColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: true // Temporarily nullable
      });
    }

    // Add zip, telNo, address1, address2 (optional, moved from Member)
    const hasZip = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'zip'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasZip.length === 0) {
      await queryInterface.addColumn('Users', 'zip', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    const hasTelNo = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'telNo'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasTelNo.length === 0) {
      await queryInterface.addColumn('Users', 'telNo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    const hasAddress1 = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'address1'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasAddress1.length === 0) {
      await queryInterface.addColumn('Users', 'address1', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    const hasAddress2 = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'Users' AND column_name = 'address2'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasAddress2.length === 0) {
      await queryInterface.addColumn('Users', 'address2', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // ============================================================
    // STEP 2: Backfill User identity from Members
    // ============================================================
    console.log('Step 2: Backfilling User identity data from Members...');
    
    // Backfill User.legalName from Members.legalName where userId is linked
    await queryInterface.sequelize.query(`
      UPDATE "Users" u
      SET "legalName" = m."legalName",
          "legalRuby" = m."legalRuby",
          "legalSex" = m."legalSex",
          "birthDate" = m."birthDate",
          "zip" = m."zip",
          "telNo" = m."telNo",
          "address1" = m."address1",
          "address2" = m."address2",
          "email" = COALESCE(m."email", u."email")
      FROM "Members" m
      WHERE u.id = m."userId" AND m."userId" IS NOT NULL
    `);

    // For users without Member records, default legalName to User.name
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET "legalName" = name
      WHERE "legalName" IS NULL OR "legalName" = ''
    `);

    // Default email to username@localhost if still missing
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET "email" = name || '@localhost'
      WHERE "email" IS NULL OR "email" = ''
    `);

    // Now make legalName and email NOT NULL
    await queryInterface.changeColumn('Users', 'legalName', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Add unique constraint on email (commented out for now - may need deduplication logic)
    // await queryInterface.addIndex('Users', ['email'], {
    //   unique: true,
    //   name: 'Users_email_key'
    // });

    // ============================================================
    // STEP 3: Check if Members table exists, rename to TenantMembers
    // ============================================================
    console.log('Step 3: Renaming Members table to TenantMembers...');
    
    const tableCheck = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'Members'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableCheck.length > 0) {
      await queryInterface.renameTable('Members', 'TenantMembers');
    } else {
      console.log('Members table does not exist, skipping rename.');
      // If Members doesn't exist, we need to create TenantMembers
      await queryInterface.createTable('TenantMembers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        tenantId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Tenants', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        memberClassId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'MemberClasses', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        operation: { type: Sequelize.TEXT, allowNull: true },
        tradingName: { type: Sequelize.STRING, allowNull: true },
        bankName: { type: Sequelize.STRING, allowNull: true },
        bankBranchName: { type: Sequelize.STRING, allowNull: true },
        accountType: { type: Sequelize.STRING, allowNull: true },
        accountNo: { type: Sequelize.STRING, allowNull: true },
        dependent: { type: Sequelize.INTEGER, allowNull: true },
        socialInsuranceNumber: { type: Sequelize.STRING, allowNull: true },
        joiningDate: { type: Sequelize.DATEONLY, allowNull: true },
        resignedDate: { type: Sequelize.DATEONLY, allowNull: true },
        resignReason: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false }
      });
    }

    // ============================================================
    // STEP 4: Add membership & permissions columns to TenantMembers
    // ============================================================
    console.log('Step 4: Adding membership and permissions columns to TenantMembers...');

    // Add isOwner (replaces role='owner')
    const hasIsOwner = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'TenantMembers' AND column_name = 'isOwner'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasIsOwner.length === 0) {
      await queryInterface.addColumn('TenantMembers', 'isOwner', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    // Add isDefault
    const hasIsDefault = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'TenantMembers' AND column_name = 'isDefault'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasIsDefault.length === 0) {
      await queryInterface.addColumn('TenantMembers', 'isDefault', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    // Add status
    const hasStatus = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'TenantMembers' AND column_name = 'status'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasStatus.length === 0) {
      await queryInterface.addColumn('TenantMembers', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      });
    }

    // Add permission columns
    const permissions = [
      'accounting',
      'fiscalBrowsing',
      'approvable',
      'administrable',
      'companyManagement',
      'inventoryManagement',
      'personnelManagement'
    ];

    for (const perm of permissions) {
      const hasColumn = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'TenantMembers' AND column_name = '${perm}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (hasColumn.length === 0) {
        await queryInterface.addColumn('TenantMembers', perm, {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
    }

    // ============================================================
    // STEP 5: Migrate data from UserTenants to TenantMembers
    // ============================================================
    console.log('Step 5: Migrating permissions from UserTenants to TenantMembers...');

    // First, update existing TenantMember records with permissions from UserTenants
    await queryInterface.sequelize.query(`
      UPDATE "TenantMembers" tm
      SET "isOwner" = (ut.role = 'owner'),
          "isDefault" = ut."isDefault",
          "status" = ut.status,
          accounting = ut.accounting,
          "fiscalBrowsing" = ut."fiscalBrowsing",
          approvable = ut.approvable,
          administrable = ut.administrable,
          "companyManagement" = ut."companyManagement",
          "inventoryManagement" = ut."inventoryManagement",
          "personnelManagement" = ut."personnelManagement"
      FROM "UserTenants" ut
      WHERE tm."userId" = ut."userId" 
        AND tm."tenantId" = ut."tenantId"
        AND tm."userId" IS NOT NULL
    `);

    // Create TenantMember records for UserTenants that don't have corresponding Members
    // These are users who have tenant access but no personnel profile yet
    await queryInterface.sequelize.query(`
      INSERT INTO "TenantMembers" (
        "userId",
        "tenantId",
        "isOwner",
        "isDefault",
        "status",
        "accounting",
        "fiscalBrowsing",
        "approvable",
        "administrable",
        "companyManagement",
        "inventoryManagement",
        "personnelManagement",
        "createdAt",
        "updatedAt"
      )
      SELECT 
        ut."userId",
        ut."tenantId",
        (ut.role = 'owner'),
        ut."isDefault",
        ut.status,
        ut.accounting,
        ut."fiscalBrowsing",
        ut.approvable,
        ut.administrable,
        ut."companyManagement",
        ut."inventoryManagement",
        ut."personnelManagement",
        NOW(),
        NOW()
      FROM "UserTenants" ut
      WHERE NOT EXISTS (
        SELECT 1 FROM "TenantMembers" tm
        WHERE tm."userId" = ut."userId" 
          AND tm."tenantId" = ut."tenantId"
      )
    `);

    // ============================================================
    // STEP 6: Validate data integrity
    // ============================================================
    console.log('Step 6: Validating data integrity...');

    const [userCount] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "Users"`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`Users count: ${userCount.count}`);

    const [userTenantCount] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "UserTenants"`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`UserTenants count: ${userTenantCount.count}`);

    const [tenantMemberCount] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "TenantMembers" WHERE "userId" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`TenantMembers (with userId) count: ${tenantMemberCount.count}`);

    if (parseInt(tenantMemberCount.count) < parseInt(userTenantCount.count)) {
      throw new Error(
        `Data integrity check failed: TenantMembers count (${tenantMemberCount.count}) ` +
        `is less than UserTenants count (${userTenantCount.count})`
      );
    }

    // ============================================================
    // STEP 7: Drop UserTenants table
    // ============================================================
    console.log('Step 7: Dropping UserTenants table...');
    await queryInterface.dropTable('UserTenants');

    // ============================================================
    // STEP 8: Update constraints and indexes
    // ============================================================
    console.log('Step 8: Adding constraints and indexes...');

    // Add partial unique index: one membership per (userId, tenantId) WHERE userId IS NOT NULL
    const hasUniqueIndex = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes 
       WHERE tablename = 'TenantMembers' 
         AND indexname = 'tenantmembers_userid_tenantid_key'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasUniqueIndex.length === 0) {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX "tenantmembers_userid_tenantid_key" 
        ON "TenantMembers" ("userId", "tenantId") 
        WHERE "userId" IS NOT NULL
      `);
    }

    // Add index on userId
    const hasUserIdIndex = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes 
       WHERE tablename = 'TenantMembers' 
         AND indexname = 'tenantmembers_userid_idx'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasUserIdIndex.length === 0) {
      await queryInterface.addIndex('TenantMembers', ['userId'], {
        name: 'tenantmembers_userid_idx'
      });
    }

    // Add index on tenantId
    const hasTenantIdIndex = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes 
       WHERE tablename = 'TenantMembers' 
         AND indexname = 'tenantmembers_tenantid_idx'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasTenantIdIndex.length === 0) {
      await queryInterface.addIndex('TenantMembers', ['tenantId'], {
        name: 'tenantmembers_tenantid_idx'
      });
    }

    // Add index on (userId, isDefault)
    const hasUserDefaultIndex = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes 
       WHERE tablename = 'TenantMembers' 
         AND indexname = 'tenantmembers_userid_isdefault_idx'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasUserDefaultIndex.length === 0) {
      await queryInterface.addIndex('TenantMembers', ['userId', 'isDefault'], {
        name: 'tenantmembers_userid_isdefault_idx'
      });
    }

    // Add index on status
    const hasStatusIndex = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_indexes 
       WHERE tablename = 'TenantMembers' 
         AND indexname = 'tenantmembers_status_idx'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (hasStatusIndex.length === 0) {
      await queryInterface.addIndex('TenantMembers', ['status'], {
        name: 'tenantmembers_status_idx'
      });
    }

    // ============================================================
    // STEP 9: Remove old permission columns from Users table
    // ============================================================
    console.log('Step 9: Removing old permission columns from Users table...');
    
    const userPermissions = [
      'accounting',
      'fiscalBrowsing',
      'approvable',
      'administrable',
      'companyManagement',
      'inventoryManagement',
      'personnelManagement'
    ];

    for (const perm of userPermissions) {
      const hasUserPerm = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'Users' AND column_name = '${perm}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (hasUserPerm.length > 0) {
        await queryInterface.removeColumn('Users', perm);
      }
    }

    console.log('Migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    // ============================================================
    // Rollback: Restore UserTenants table and revert changes
    // ============================================================
    console.log('Rolling back: Recreating UserTenants table...');

    // Recreate UserTenants table
    await queryInterface.createTable('UserTenants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
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
      accounting: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      fiscalBrowsing: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      approvable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      administrable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      companyManagement: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      inventoryManagement: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      personnelManagement: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // Restore data from TenantMembers back to UserTenants
    await queryInterface.sequelize.query(`
      INSERT INTO "UserTenants" (
        "userId", "tenantId", role, status, "isDefault",
        accounting, "fiscalBrowsing", approvable, administrable,
        "companyManagement", "inventoryManagement", "personnelManagement",
        "createdAt", "updatedAt"
      )
      SELECT 
        "userId", "tenantId",
        CASE WHEN "isOwner" THEN 'owner' ELSE 'member' END,
        status, "isDefault",
        accounting, "fiscalBrowsing", approvable, administrable,
        "companyManagement", "inventoryManagement", "personnelManagement",
        "createdAt", "updatedAt"
      FROM "TenantMembers"
      WHERE "userId" IS NOT NULL
    `);

    // Add indexes back to UserTenants
    await queryInterface.addIndex('UserTenants', ['userId', 'tenantId'], {
      unique: true
    });
    await queryInterface.addIndex('UserTenants', ['userId']);
    await queryInterface.addIndex('UserTenants', ['tenantId']);
    await queryInterface.addIndex('UserTenants', ['userId', 'isDefault']);

    // Rename TenantMembers back to Members
    await queryInterface.renameTable('TenantMembers', 'Members');

    // Remove membership columns from Members
    const membershipColumns = [
      'isOwner', 'isDefault', 'status',
      'accounting', 'fiscalBrowsing', 'approvable', 'administrable',
      'companyManagement', 'inventoryManagement', 'personnelManagement'
    ];
    for (const col of membershipColumns) {
      const hasCol = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'Members' AND column_name = '${col}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (hasCol.length > 0) {
        await queryInterface.removeColumn('Members', col);
      }
    }

    // Remove identity columns from Users
    const identityColumns = [
      'legalName', 'legalRuby', 'legalSex', 'birthDate', 
      'email', 'zip', 'telNo', 'address1', 'address2'
    ];
    for (const col of identityColumns) {
      const hasCol = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'Users' AND column_name = '${col}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (hasCol.length > 0) {
        await queryInterface.removeColumn('Users', col);
      }
    }

    // Restore permission columns to Users
    const userPermissions = [
      'accounting', 'fiscalBrowsing', 'approvable', 'administrable',
      'companyManagement', 'inventoryManagement', 'personnelManagement'
    ];
    for (const perm of userPermissions) {
      const hasPerm = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'Users' AND column_name = '${perm}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (hasPerm.length === 0) {
        await queryInterface.addColumn('Users', perm, {
          type: Sequelize.BOOLEAN,
          allowNull: true
        });
      }
    }

    console.log('Rollback completed.');
  }
};
