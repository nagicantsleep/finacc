import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AttendanceRecord extends Model {
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
    }
  }

  AttendanceRecord.init(
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      clockIn: {
        type: DataTypes.DATE,
        allowNull: true
      },
      clockOut: {
        type: DataTypes.DATE,
        allowNull: true
      },
      breakMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60
      },
      workHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      overtimeHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      nightHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      earlyMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'present' // present, absent, late, leave, holiday, remote, overtime
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AttendanceRecord',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'userId', 'date']
        },
        {
          fields: ['tenantId', 'date']
        }
      ]
    }
  );

  return AttendanceRecord;
};
