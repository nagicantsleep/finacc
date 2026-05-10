import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      // Has many tenant members
      this.hasMany(models.TenantMember, {
        foreignKey: 'tenantId',
        as: 'members'
      });
      // Belongs to many users through TenantMember
      this.belongsToMany(models.User, {
        through: models.TenantMember,
        foreignKey: 'tenantId',
        otherKey: 'userId',
        as: 'users'
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
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'Tenant',
  });
  return Tenant;
};
