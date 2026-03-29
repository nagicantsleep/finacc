import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class Sticky extends Model {
    static associate(models) {
      this.hasMany(models.StickyStatus, {
        foreignKey: 'stickyId',
        onDelete: 'CASCADE'
      });
    }
  }
  Sticky.init({
    tenantId: DataTypes.INTEGER,
    authorId: DataTypes.INTEGER,
    message: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Sticky',
  });
  return Sticky;
};