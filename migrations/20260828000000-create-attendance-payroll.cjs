'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. AttendanceRecords
    await queryInterface.createTable('AttendanceRecords', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      clockIn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      clockOut: {
        type: Sequelize.DATE,
        allowNull: true
      },
      breakMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60
      },
      workHours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeHours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      nightHours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      lateMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      earlyMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'present'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(50),
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

    await queryInterface.addIndex('AttendanceRecords', ['tenantId', 'userId', 'date'], {
      unique: true,
      name: 'idx_attendance_records_tenant_user_date'
    });
    await queryInterface.addIndex('AttendanceRecords', ['tenantId', 'date'], {
      name: 'idx_attendance_records_tenant_date'
    });

    // 2. LeaveRequests
    await queryInterface.createTable('LeaveRequests', {
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
      leaveType: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'paid_annual'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      days: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 1.0
      },
      reason: {
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

    await queryInterface.addIndex('LeaveRequests', ['tenantId', 'userId'], {
      name: 'idx_leave_requests_tenant_user'
    });
    await queryInterface.addIndex('LeaveRequests', ['tenantId', 'status'], {
      name: 'idx_leave_requests_tenant_status'
    });

    // 3. SalaryFormulas
    await queryInterface.createTable('SalaryFormulas', {
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
      memberClassId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'MemberClasses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      baseSalary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      hourlyRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeMultiplier: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.25
      },
      weekendMultiplier: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.50
      },
      holidayMultiplier: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 2.00
      },
      allowances: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      deductions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
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

    await queryInterface.addIndex('SalaryFormulas', ['tenantId', 'tenantMemberId'], {
      name: 'idx_salary_formulas_tenant_member'
    });

    // 4. PayrollPeriods
    await queryInterface.createTable('PayrollPeriods', {
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
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      paymentDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'draft'
      },
      totalGrossPay: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalDeductions: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalNetPay: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
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
      paymentCrossSlipId: {
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

    await queryInterface.addIndex('PayrollPeriods', ['tenantId', 'year', 'month'], {
      unique: true,
      name: 'idx_payroll_periods_tenant_year_month'
    });

    // 5. PayrollSlips
    await queryInterface.createTable('PayrollSlips', {
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
      payrollPeriodId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'PayrollPeriods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenantMemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TenantMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      workingDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      workHours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeHours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      leaveDays: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 0.0
      },
      basePay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimePay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      allowancesDetail: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      allowancesTotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      grossPay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      deductionsDetail: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      deductionsTotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      netPay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'calculated'
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

    await queryInterface.addIndex('PayrollSlips', ['tenantId', 'payrollPeriodId', 'tenantMemberId'], {
      unique: true,
      name: 'idx_payroll_slips_tenant_period_member'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PayrollSlips');
    await queryInterface.dropTable('PayrollPeriods');
    await queryInterface.dropTable('SalaryFormulas');
    await queryInterface.dropTable('LeaveRequests');
    await queryInterface.dropTable('AttendanceRecords');
  }
};
