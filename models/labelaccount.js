import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class LabelAccount extends Model {
    static associate(models) {
      // no association
    }
  };
  LabelAccount.init({
    tenantId: {
      type: DataTypes.INTEGER,
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
