import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExpenseClaim extends Model {
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
      this.belongsTo(models.ExpenseAdvance, {
        foreignKey: 'expenseAdvanceId',
        as: 'advance'
      });
      this.belongsTo(models.User, {
        foreignKey: 'reviewedById',
        as: 'reviewer'
      });
      this.belongsTo(models.CrossSlip, {
        foreignKey: 'crossSlipId',
        as: 'crossSlip'
      });
      this.hasMany(models.ExpenseClaimItem, {
        foreignKey: 'expenseClaimId',
        as: 'items'
      });
    }
  }

  ExpenseClaim.init(
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
      expenseAdvanceId: {
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
      claimDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      totalAmount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      advanceAmount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      netAmount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'draft' // draft, submitted, approved, settled, rejected
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
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpenseClaim',
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

  return ExpenseClaim;
};
