import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExpenseClaimItem extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.ExpenseClaim, {
        foreignKey: 'expenseClaimId',
        as: 'claim'
      });
      this.belongsTo(models.ExpenseCategory, {
        foreignKey: 'expenseCategoryId',
        as: 'category'
      });
      this.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });
      this.belongsTo(models.Voucher, {
        foreignKey: 'voucherId',
        as: 'voucher'
      });
      this.belongsTo(models.TaxRule, {
        foreignKey: 'taxRuleId',
        as: 'taxRule'
      });
    }
  }

  ExpenseClaimItem.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      expenseClaimId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      expenseCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      voucherId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxAmount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxRuleId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      receiptUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpenseClaimItem',
      indexes: [
        {
          fields: ['tenantId', 'expenseClaimId']
        },
        {
          fields: ['tenantId', 'expenseCategoryId']
        }
      ]
    }
  );

  return ExpenseClaimItem;
};
