import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class RegistryEntry extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.RegistryDefinition, {
        foreignKey: 'registryDefinitionId',
        as: 'definition'
      });
      this.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      this.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'creator'
      });
      this.hasMany(models.RegistryTimeline, {
        foreignKey: 'registryEntryId',
        as: 'timelines'
      });
    }
  }

  RegistryEntry.init(
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
      registryDefinitionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'RegistryDefinitions',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'open'
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updatedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    },
    {
      sequelize,
      modelName: 'RegistryEntry',
      tableName: 'RegistryEntries',
      indexes: [
        {
          fields: ['tenantId', 'registryDefinitionId']
        },
        {
          fields: ['tenantId', 'companyId']
        },
        {
          fields: ['tenantId', 'status']
        }
      ]
    }
  );

  return RegistryEntry;
};
