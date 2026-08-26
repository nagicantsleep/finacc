import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class RegistryTimeline extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      this.belongsTo(models.RegistryEntry, {
        foreignKey: 'registryEntryId',
        as: 'entry'
      });
      this.belongsTo(models.User, {
        foreignKey: 'authorId',
        as: 'author'
      });
    }
  }

  RegistryTimeline.init(
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
      registryEntryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'RegistryEntries',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'comment'
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      changes: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      authorId: {
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
      modelName: 'RegistryTimeline',
      tableName: 'RegistryTimelines',
      indexes: [
        {
          fields: ['tenantId', 'registryEntryId']
        }
      ]
    }
  );

  return RegistryTimeline;
};
