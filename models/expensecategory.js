import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExpenseCategory extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.hasMany(models.ExpenseClaimItem, {
        foreignKey: 'expenseCategoryId',
        as: 'items'
      });
    }
  }

  ExpenseCategory.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      accountCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '642'
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'bi-receipt'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      requiresReceipt: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active'
      }
    },
    {
      sequelize,
      modelName: 'ExpenseCategory',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'code']
        }
      ]
    }
  );

  return ExpenseCategory;
};
