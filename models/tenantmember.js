import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
  class TenantMember extends Model {
    /**
     * TenantMember represents both tenant membership (access rights) and personnel profile.
     * Merges the old UserTenant and Member models.
     */
    static associate(models) {
      // Belongs to User (nullable - allows non-login members like contractors)
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Belongs to Tenant
      this.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      
      // Belongs to MemberClass (employee classification)
      this.belongsTo(models.MemberClass, {
        foreignKey: 'memberClassId',
        as: 'memberClass'
      });
    }

    /**
     * Get the display name for this member
     * Priority: tradingName > User.legalName > '(未設定)'
     */
    getDisplayName() {
      if (this.tradingName) {
        return this.tradingName;
      }
      if (this.user && this.user.legalName) {
        return this.user.legalName;
      }
      return '(未設定)';
    }

    /**
     * Check if this member can log in
     */
    get canLogin() {
      return this.userId !== null && this.status === 'active';
    }

    /**
     * Check if this member has any permissions
     */
    get hasAnyPermission() {
      return this.accounting || 
             this.fiscalBrowsing || 
             this.approvable || 
             this.administrable ||
             this.companyManagement || 
             this.inventoryManagement || 
             this.personnelManagement;
    }
  }
  
  TenantMember.init({
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Foreign keys
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL = non-login member (contractors, etc)
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
    memberClassId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'MemberClasses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    // Membership & ownership (from UserTenant)
    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Tenant owner flag (renamed from role=owner)'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Default tenant for this user'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      comment: 'active | inactive'
    },

    // Permissions (from UserTenant)
    accounting: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    fiscalBrowsing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    approvable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    administrable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    companyManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    inventoryManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    personnelManagement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // Tenant-internal identity & display
    tradingName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tenant display name. REQUIRED when userId IS NULL, optional otherwise. Defaults to User.legalName if empty.'
    },

    // HR/Personnel fields (from Member)
    operation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes'
    },

    // Bank info (tenant-specific salary account)
    bankName: DataTypes.STRING,
    bankBranchName: DataTypes.STRING,
    accountType: DataTypes.STRING,
    accountNo: DataTypes.STRING,

    // Tax & insurance (tenant-specific)
    dependent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '扶養家族 - dependents for tax calc'
    },
    socialInsuranceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tenant-specific social insurance'
    },

    // Employment dates
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '入社日'
    },
    resignedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '退職日'
    },
    resignReason: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Resign reason code'
    }
  }, {
    sequelize,
    modelName: 'TenantMember',
    indexes: [
      {
        // Partial unique index: one membership per (userId, tenantId) WHERE userId IS NOT NULL
        unique: true,
        fields: ['userId', 'tenantId'],
        where: {
          userId: { [sequelize.Sequelize.Op.ne]: null }
        },
        name: 'tenantmembers_userid_tenantid_key'
      },
      {
        fields: ['userId'],
        name: 'tenantmembers_userid_idx'
      },
      {
        fields: ['tenantId'],
        name: 'tenantmembers_tenantid_idx'
      },
      {
        fields: ['userId', 'isDefault'],
        name: 'tenantmembers_userid_isdefault_idx'
      },
      {
        fields: ['status'],
        name: 'tenantmembers_status_idx'
      }
    ],
    hooks: {
      beforeValidate: (tenantMember) => {
        // Rule 1: tradingName required when userId is null
        if (!tenantMember.userId && !tenantMember.tradingName) {
          throw new Error('tradingName is required for members without user accounts');
        }
        
        // Rule 2: permissions must be false when userId is null
        if (!tenantMember.userId) {
          tenantMember.isOwner = false;
          tenantMember.isDefault = false;
          tenantMember.accounting = false;
          tenantMember.fiscalBrowsing = false;
          tenantMember.approvable = false;
          tenantMember.administrable = false;
          tenantMember.companyManagement = false;
          tenantMember.inventoryManagement = false;
          tenantMember.personnelManagement = false;
        }
      }
    }
  });
  
  return TenantMember;
};
