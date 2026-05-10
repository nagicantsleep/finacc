'use strict';

/**
 * Composite tenant FK enforcement.
 *
 * Step 1: Add UNIQUE(id, tenantId) to parent tables so they can be referenced
 *         by composite FKs from child tables.
 *
 * Step 2: Add composite FK constraints on child tables so that
 *         child.parentId + child.tenantId must match parent.id + parent.tenantId.
 *         This prevents a child row in Tenant A from referencing a parent row
 *         belonging to Tenant B.
 *
 * Relationship map:
 *   CrossSlipDetails (crossSlipId, tenantId)  -> CrossSlips (id, tenantId)
 *   VoucherFiles     (voucherId,   tenantId)  -> Vouchers   (id, tenantId)
 *   DocumentFiles    (documentId,  tenantId)  -> Documents  (id, tenantId)
 *   TaskDetails      (taskId,      tenantId)  -> Tasks      (id, tenantId)
 *   TransactionDetails (transactionDocumentId, tenantId) -> TransactionDocuments (id, tenantId)
 *   ProjectLabels    (projectId,   tenantId)  -> Projects   (id, tenantId)
 *   LabelAccounts    (labelId,     tenantId)  -> Labels     (id, tenantId)
 */

const PARENT_UNIQUE_KEYS = [
  { table: 'CrossSlips',            constraint: 'CrossSlips_id_tenantId_key' },
  { table: 'Vouchers',              constraint: 'Vouchers_id_tenantId_key' },
  { table: 'Documents',             constraint: 'Documents_id_tenantId_key' },
  { table: 'Tasks',                 constraint: 'Tasks_id_tenantId_key' },
  { table: 'TransactionDocuments',  constraint: 'TransactionDocuments_id_tenantId_key' },
  { table: 'Projects',              constraint: 'Projects_id_tenantId_key' },
  { table: 'Labels',                constraint: 'Labels_id_tenantId_key' },
];

const CHILD_COMPOSITE_FKS = [
  {
    child: 'CrossSlipDetails',
    childCols: ['crossSlipId', 'tenantId'],
    parent: 'CrossSlips',
    parentCols: ['id', 'tenantId'],
    constraint: 'CrossSlipDetails_crossSlipId_tenantId_fkey',
  },
  {
    child: 'VoucherFiles',
    childCols: ['voucherId', 'tenantId'],
    parent: 'Vouchers',
    parentCols: ['id', 'tenantId'],
    constraint: 'VoucherFiles_voucherId_tenantId_fkey',
  },
  {
    child: 'DocumentFiles',
    childCols: ['documentId', 'tenantId'],
    parent: 'Documents',
    parentCols: ['id', 'tenantId'],
    constraint: 'DocumentFiles_documentId_tenantId_fkey',
  },
  {
    child: 'TaskDetails',
    childCols: ['taskId', 'tenantId'],
    parent: 'Tasks',
    parentCols: ['id', 'tenantId'],
    constraint: 'TaskDetails_taskId_tenantId_fkey',
  },
  {
    child: 'TransactionDetails',
    childCols: ['transactionDocumentId', 'tenantId'],
    parent: 'TransactionDocuments',
    parentCols: ['id', 'tenantId'],
    constraint: 'TransactionDetails_transactionDocumentId_tenantId_fkey',
  },
  {
    child: 'ProjectLabels',
    childCols: ['projectId', 'tenantId'],
    parent: 'Projects',
    parentCols: ['id', 'tenantId'],
    constraint: 'ProjectLabels_projectId_tenantId_fkey',
  },
  {
    child: 'LabelAccounts',
    childCols: ['labelId', 'tenantId'],
    parent: 'Labels',
    parentCols: ['id', 'tenantId'],
    constraint: 'LabelAccounts_labelId_tenantId_fkey',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Step 1: add UNIQUE(id, tenantId) on each parent table.
    // IF NOT EXISTS guard: check information_schema first to be idempotent.
    for (const { table, constraint } of PARENT_UNIQUE_KEYS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1
         FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = :table
           AND constraint_name = :constraint
         LIMIT 1;`,
        { replacements: { table, constraint } }
      );
      if (rows.length === 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" UNIQUE (id, "tenantId");`
        );
      }
    }

    // Step 2: add composite FK on each child table.
    for (const { child, childCols, parent, parentCols, constraint } of CHILD_COMPOSITE_FKS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1
         FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = :table
           AND constraint_name = :constraint
         LIMIT 1;`,
        { replacements: { table: child, constraint } }
      );
      if (rows.length === 0) {
        const childColsSql  = childCols.map(c => `"${c}"`).join(', ');
        const parentColsSql = parentCols.map(c => `"${c}"`).join(', ');
        await queryInterface.sequelize.query(
          `ALTER TABLE "${child}"
           ADD CONSTRAINT "${constraint}"
           FOREIGN KEY (${childColsSql})
           REFERENCES "${parent}" (${parentColsSql})
           ON DELETE CASCADE ON UPDATE CASCADE;`
        );
      }
    }
  },

  async down(queryInterface) {
    // Drop composite FKs first (children depend on parent unique keys).
    for (const { child, constraint } of CHILD_COMPOSITE_FKS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1
         FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = :table
           AND constraint_name = :constraint
         LIMIT 1;`,
        { replacements: { table: child, constraint } }
      );
      if (rows.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${child}" DROP CONSTRAINT "${constraint}";`
        );
      }
    }

    // Then drop the parent unique keys.
    for (const { table, constraint } of PARENT_UNIQUE_KEYS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1
         FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = :table
           AND constraint_name = :constraint
         LIMIT 1;`,
        { replacements: { table, constraint } }
      );
      if (rows.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}";`
        );
      }
    }
  },
};
