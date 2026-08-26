import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PayrollPeriod extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.hasMany(models.PayrollSlip, {
        foreignKey: 'payrollPeriodId',
        as: 'slips'
      });
      this.belongsTo(models.CrossSlip, {
        foreignKey: 'crossSlipId',
        as: 'crossSlip'
      });
      this.belongsTo(models.CrossSlip, {
        foreignKey: 'paymentCrossSlipId',
        as: 'paymentCrossSlip'
      });
    }
  }

  PayrollPeriod.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'draft' // draft, calculated, approved, paid, closed
      },
      totalGrossPay: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalDeductions: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalNetPay: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      crossSlipId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      paymentCrossSlipId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PayrollPeriod',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'year', 'month']
        }
      ]
    }
  );

  return PayrollPeriod;
};
