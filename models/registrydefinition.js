import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class RegistryDefinition extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.hasMany(models.RegistryEntry, {
        foreignKey: 'registryDefinitionId',
        as: 'entries'
      });
    }
  }

  RegistryDefinition.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      icon: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'bi-journal-bookmark'
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'archived']]
        }
      },
      schema: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: { fields: [] }
      },
      layout: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'RegistryDefinition',
      tableName: 'RegistryDefinitions',
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'code']
        }
      ]
    }
  );

  return RegistryDefinition;
};
