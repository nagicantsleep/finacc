import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PayrollSlip extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.PayrollPeriod, {
        foreignKey: 'payrollPeriodId',
        as: 'period'
      });
      this.belongsTo(models.TenantMember, {
        foreignKey: 'tenantMemberId',
        as: 'member'
      });
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  PayrollSlip.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      payrollPeriodId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tenantMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      workingDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      workHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      leaveDays: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 0.0
      },
      basePay: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimePay: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      allowancesDetail: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      allowancesTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      grossPay: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      deductionsDetail: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      deductionsTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      netPay: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'calculated' // draft, calculated, approved, paid
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PayrollSlip',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'payrollPeriodId', 'tenantMemberId']
        },
        {
          fields: ['tenantId', 'tenantMemberId']
        }
      ]
    }
  );

  return PayrollSlip;
};
