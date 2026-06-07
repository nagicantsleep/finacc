import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class SimulationScenario extends Model {
    static associate(models) {
      this.hasMany(models.SimulationEntry, {
        foreignKey: 'scenarioId',
        as: 'entries',
        onDelete: 'cascade',
        onUpdate: 'cascade'
      });
      this.hasMany(models.SimulationAssumption, {
        foreignKey: 'scenarioId',
        as: 'assumptions',
        onDelete: 'cascade',
        onUpdate: 'cascade'
      });
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.User, {
        foreignKey: 'ownerId',
        as: 'owner'
      });
      this.belongsTo(models.User, {
        foreignKey: 'lockedBy',
        as: 'locker'
      });
    }
  };
  SimulationScenario.init({
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: DataTypes.TEXT,
    baseTerm: { type: DataTypes.INTEGER, allowNull: false },
    basePeriodFrom: { type: DataTypes.DATEONLY, allowNull: false },
    basePeriodTo: { type: DataTypes.DATEONLY, allowNull: false },
    simPeriodFrom: { type: DataTypes.DATEONLY, allowNull: false },
    simPeriodTo: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'draft' },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    visibility: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'private' },
    lockedAt: { type: DataTypes.DATEONLY, allowNull: true },
    lockedBy: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    sequelize,
    modelName: 'SimulationScenario',
  });
  return SimulationScenario;
};
