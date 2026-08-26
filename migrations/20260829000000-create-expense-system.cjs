'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. ExpenseCategories
    await queryInterface.createTable('ExpenseCategories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      accountCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '642'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'bi-receipt'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      requiresReceipt: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('ExpenseCategories', ['tenantId', 'code'], {
      unique: true,
      name: 'idx_expense_categories_tenant_code'
    });

    // 2. ExpenseAdvances
    await queryInterface.createTable('ExpenseAdvances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenantMemberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'TenantMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      requestDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      expectedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      reviewedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      crossSlipId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CrossSlips',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('ExpenseAdvances', ['tenantId', 'code'], {
      unique: true,
      name: 'idx_expense_advances_tenant_code'
    });
    await queryInterface.addIndex('ExpenseAdvances', ['tenantId', 'userId'], {
      name: 'idx_expense_advances_tenant_user'
    });
    await queryInterface.addIndex('ExpenseAdvances', ['tenantId', 'status'], {
      name: 'idx_expense_advances_tenant_status'
    });

    // 3. ExpenseClaims
    await queryInterface.createTable('ExpenseClaims', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenantMemberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'TenantMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      expenseAdvanceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ExpenseAdvances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      claimDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      totalAmount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      advanceAmount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      netAmount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'draft'
      },
      reviewedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      crossSlipId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CrossSlips',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('ExpenseClaims', ['tenantId', 'code'], {
      unique: true,
      name: 'idx_expense_claims_tenant_code'
    });
    await queryInterface.addIndex('ExpenseClaims', ['tenantId', 'userId'], {
      name: 'idx_expense_claims_tenant_user'
    });
    await queryInterface.addIndex('ExpenseClaims', ['tenantId', 'status'], {
      name: 'idx_expense_claims_tenant_status'
    });

    // 4. ExpenseClaimItems
    await queryInterface.createTable('ExpenseClaimItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      expenseClaimId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ExpenseClaims',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      expenseCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ExpenseCategories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      voucherId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Vouchers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxAmount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxRuleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'TaxRules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      receiptUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('ExpenseClaimItems', ['tenantId', 'expenseClaimId'], {
      name: 'idx_expense_claim_items_tenant_claim'
    });
    await queryInterface.addIndex('ExpenseClaimItems', ['tenantId', 'expenseCategoryId'], {
      name: 'idx_expense_claim_items_tenant_category'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ExpenseClaimItems');
    await queryInterface.dropTable('ExpenseClaims');
    await queryInterface.dropTable('ExpenseAdvances');
    await queryInterface.dropTable('ExpenseCategories');
  }
};
