import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExpenseAdvance extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      this.belongsTo(models.TenantMember, {
        foreignKey: 'tenantMemberId',
        as: 'member'
      });
      this.belongsTo(models.Project, {
        foreignKey: 'projectId',
        as: 'project'
      });
      this.belongsTo(models.User, {
        foreignKey: 'reviewedById',
        as: 'reviewer'
      });
      this.belongsTo(models.CrossSlip, {
        foreignKey: 'crossSlipId',
        as: 'crossSlip'
      });
      this.hasOne(models.ExpenseClaim, {
        foreignKey: 'expenseAdvanceId',
        as: 'claim'
      });
    }
  }

  ExpenseAdvance.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tenantMemberId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      requestDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      expectedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending' // pending, approved, disbursed, settled, rejected
      },
      reviewedById: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reviewComment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      crossSlipId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpenseAdvance',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'code']
        },
        {
          fields: ['tenantId', 'userId']
        },
        {
          fields: ['tenantId', 'status']
        }
      ]
    }
  );

  return ExpenseAdvance;
};
