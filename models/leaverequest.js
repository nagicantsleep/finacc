import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class LeaveRequest extends Model {
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
      this.belongsTo(models.User, {
        foreignKey: 'reviewedById',
        as: 'reviewer'
      });
    }
  }

  LeaveRequest.init(
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
      leaveType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'paid_annual' // paid_annual, unpaid, sick, maternity, special
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      days: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 1.0
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending' // pending, approved, rejected, cancelled
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
      }
    },
    {
      sequelize,
      modelName: 'LeaveRequest',
      indexes: [
        {
          fields: ['tenantId', 'userId']
        },
        {
          fields: ['tenantId', 'status']
        }
      ]
    }
  );

  return LeaveRequest;
};
