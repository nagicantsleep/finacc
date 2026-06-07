import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class AuditEvent extends Model {
    static associate(models) {
      // define association here
    }
  };
  AuditEvent.init({
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: DataTypes.INTEGER,
    action: { type: DataTypes.STRING, allowNull: false },
    term: DataTypes.INTEGER,
    payload: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'AuditEvent',
  });
  return AuditEvent;
};
