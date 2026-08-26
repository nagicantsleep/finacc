import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class SalaryFormula extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.TenantMember, {
        foreignKey: 'tenantMemberId',
        as: 'member'
      });
      this.belongsTo(models.MemberClass, {
        foreignKey: 'memberClassId',
        as: 'memberClass'
      });
    }
  }

  SalaryFormula.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tenantMemberId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      memberClassId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      baseSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeMultiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.25
      },
      weekendMultiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.50
      },
      holidayMultiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 2.00
      },
      allowances: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      deductions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active'
      }
    },
    {
      sequelize,
      modelName: 'SalaryFormula',
      indexes: [
        {
          fields: ['tenantId', 'tenantMemberId']
        },
        {
          fields: ['tenantId', 'memberClassId']
        }
      ]
    }
  );

  return SalaryFormula;
};
