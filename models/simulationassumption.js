import {Model} from 'sequelize';
export default (sequelize, DataTypes) => {
  class SimulationAssumption extends Model {
    static associate(models) {
      this.belongsTo(models.SimulationScenario, {
        foreignKey: 'scenarioId',
        as: 'scenario',
        onDelete: 'cascade',
        onUpdate: 'cascade'
      });
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
    }
  }
  SimulationAssumption.init({
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    scenarioId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(32), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    parameters: { type: DataTypes.JSONB, allowNull: false },
    startMonth: { type: DataTypes.DATEONLY, allowNull: false },
    endMonth: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
    generatedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    generatedHash: { type: DataTypes.STRING(64), allowNull: true },
  }, {
    sequelize,
    modelName: 'SimulationAssumption',
  });
  return SimulationAssumption;
};
