import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      this.hasMany(models.UserTenant, {
        foreignKey: 'tenantId',
        as: 'memberships'
      });
      this.belongsToMany(models.User, {
        through: models.UserTenant,
        foreignKey: 'tenantId',
        otherKey: 'userId',
        as: 'users'
      });
      this.hasMany(models.Member, {
        foreignKey: 'tenantId',
        as: 'members'
      });
    }
  }
  Tenant.init({
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Tenant',
  });
  return Tenant;
};
