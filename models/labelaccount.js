import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class LabelAccount extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
    }
  };
  LabelAccount.init({
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    labelId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    summaryType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'credit'
    }
  }, {
    sequelize,
    modelName: 'LabelAccount',
  });
  return LabelAccount;
};
