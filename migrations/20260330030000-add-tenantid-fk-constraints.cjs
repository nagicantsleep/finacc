'use strict';

const TENANT_TABLES = [
  'UserTenants',
  'Members',
  'FiscalYears',
  'AccountClasses',
  'Accounts',
  'SubAccounts',
  'AccountRemainings',
  'SubAccountRemainings',
  'CrossSlips',
  'MonthlyLogs',
  'Companies',
  'CompanyClasses',
  'Items',
  'ItemClasses',
  'TransactionDocuments',
  'TransactionKinds',
  'Vouchers',
  'VoucherClasses',
  'Documents',
  'Tasks',
  'Menus',
  'TaxRules',
  'Projects',
  'Labels',
  'TransactionDetails',
  'TaskDetails',
  'CrossSlipDetails',
  'VoucherFiles',
  'DocumentFiles',
  'ProjectLabels',
  'LabelAccounts',
  'Stickies',
  'StickyStatuses',
];

const BUSINESS_SLICE_TABLES = [
  'Companies',
  'CompanyClasses',
  'Items',
  'ItemClasses',
  'TransactionDocuments',
  'TransactionKinds',
  'Vouchers',
  'VoucherClasses',
  'Documents',
  'Tasks',
  'Menus',
  'TaxRules',
  'Projects',
  'Labels',
];

const getTenantConstraintName = (table) => `${table}_tenantId_fkey`;

const hasTenantColumn = async (queryInterface, table) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = :table
       AND column_name = 'tenantId'
     LIMIT 1;`,
    { replacements: { table } }
  );

  return rows.length > 0;
};

const isTenantColumnNullable = async (queryInterface, table) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = :table
       AND column_name = 'tenantId'
     LIMIT 1;`,
    { replacements: { table } }
  );

  return rows[0]?.is_nullable === 'YES';
};

const listTenantFkConstraints = async (queryInterface, table) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT tc.constraint_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = :table
       AND tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'tenantId'
       AND ccu.table_name = 'Tenants'
       AND ccu.column_name = 'id';`,
    { replacements: { table } }
  );

  return rows.map((row) => row.constraint_name);
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const table of BUSINESS_SLICE_TABLES) {
      if (!(await hasTenantColumn(queryInterface, table))) {
        continue;
      }

      if (await isTenantColumnNullable(queryInterface, table)) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ALTER COLUMN "tenantId" SET NOT NULL;`
        );
      }
    }

    for (const table of TENANT_TABLES) {
      if (!(await hasTenantColumn(queryInterface, table))) {
        continue;
      }

      const constraintName = getTenantConstraintName(table);
      const existingConstraints = await listTenantFkConstraints(queryInterface, table);

      for (const existingConstraint of existingConstraints) {
        if (existingConstraint !== constraintName) {
          await queryInterface.removeConstraint(table, existingConstraint);
        }
      }

      if (!existingConstraints.includes(constraintName)) {
        await queryInterface.addConstraint(table, {
          fields: ['tenantId'],
          type: 'foreign key',
          name: constraintName,
          references: {
            table: 'Tenants',
            field: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        });
      }
    }
  },

  async down(queryInterface) {
    for (const table of TENANT_TABLES) {
      if (!(await hasTenantColumn(queryInterface, table))) {
        continue;
      }

      const constraintName = getTenantConstraintName(table);
      const existingConstraints = await listTenantFkConstraints(queryInterface, table);

      if (existingConstraints.includes(constraintName)) {
        await queryInterface.removeConstraint(table, constraintName);
      }
    }

    for (const table of BUSINESS_SLICE_TABLES) {
      if (!(await hasTenantColumn(queryInterface, table))) {
        continue;
      }

      if (!(await isTenantColumnNullable(queryInterface, table))) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ALTER COLUMN "tenantId" DROP NOT NULL;`
        );
      }
    }
  },
};
