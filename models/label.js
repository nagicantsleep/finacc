import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Label extends Model {
    static associate(models) {
      this.belongsToMany(models.Project, {
        through: 'ProjectLabels',
        foreignKey: 'labelId',
        otherKey: 'projectId',
        as: 'projects'
      });
      this.belongsToMany(models.Account, {
        through: 'LabelAccounts',
        foreignKey: 'labelId',
        otherKey: 'accountId',
        as: 'accounts'
      });
    }
  };
  Label.init({
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Label',
    indexes: [
      { unique: true, fields: ['tenantId', 'name'] }
    ]
  });
  return Label;
};
