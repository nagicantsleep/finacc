import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserTenant extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
    }
  }
  UserTenant.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    accounting: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    fiscalBrowsing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    approvable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    administrable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    companyManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    inventoryManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    personnelManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserTenant',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'tenantId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['tenantId']
      },
      {
        fields: ['userId', 'isDefault']
      }
    ]
  });
  return UserTenant;
};
