import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class SimulationEntry extends Model {
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
  };
  SimulationEntry.init({
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    scenarioId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    debitAccount: { type: DataTypes.STRING(20), allowNull: false },
    debitSubAccount: { type: DataTypes.INTEGER, allowNull: true },
    debitAmount: { type: DataTypes.DECIMAL(12), allowNull: false },
    creditAccount: { type: DataTypes.STRING(20), allowNull: false },
    creditSubAccount: { type: DataTypes.INTEGER, allowNull: true },
    creditAmount: { type: DataTypes.DECIMAL(12), allowNull: false },
    taxRuleId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    labelId: { type: DataTypes.INTEGER, allowNull: true },
    memo: { type: DataTypes.STRING(500), allowNull: true },
    sourceType: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'manual' },
  }, {
    sequelize,
    modelName: 'SimulationEntry',
  });
  return SimulationEntry;
};
