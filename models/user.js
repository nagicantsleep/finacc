import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10;
const NG_NAMES = [
	'admin',
	'manage',
	'manager',
	'root',
	'api',
	'user'
];

import {Model} from 'sequelize';

export default (sequelize, DataTypes) => {
	class User extends Model  {
    static  associate(models) {
      // Has many tenant memberships
      this.hasMany(models.TenantMember, {
        foreignKey: 'userId',
        as: 'memberships'
      });
      // Belongs to many tenants through TenantMember
      this.belongsToMany(models.Tenant, {
        through: models.TenantMember,
        foreignKey: 'userId',
        otherKey: 'tenantId',
        as: 'tenants'
      });
    }
    set password(p) {
      this.hashPassword = bcrypt.hashSync(p, SALT_ROUNDS);
    }
    get password() {
      return (this.hashPassword);
    }
    get is_live() {
      console.log('is_live', this.deauthorizedAt);
      return  ((( this.deauthorizedAt === null ) || ( this.deauthorizedAt > new Date ())) ? true : false);
    }
    static check(name, password) {
    	if	( NG_NAMES.indexOf(name) >= 0 )	{
        return	new Promise((resolve, reject) => {
          //console.log('invalid name', name);
          reject(`invalid name: '${name}'`);
        });
      } else {
			  return	this.findOne({
				  where: {
				  	name: name },
			  });
		  }
		}
  }
  User.init({
    // Authentication
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Login username'
    },
    hashPassword: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deauthorizedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Global account disable'
    },

    // Real-world identity (moved from Member)
    legalName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '戸籍名 - legal/official name'
    },
    legalRuby: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '読み - phonetic reading'
    },
    legalSex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '戸籍性別 - legal sex'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '誕生日'
    },

    // Global contact info
    zip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '郵便番号'
    },
    address1: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '住所'
    },
    address2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Required for password reset'
    },
    telNo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '電話'
    },

    // Bilingual display preference (user-level, tenant-independent)
    languagePair: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'User-level language pair preference. Null = system default {ja,vi}. e.g. {"primary":"ja","secondary":"vi"}'
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeValidate: (user) => {
        // Rule 1: legalName is required
        if (!user.legalName || user.legalName.trim() === '') {
          throw new Error('legalName is required');
        }
        // Rule 2: email is required
        if (!user.email || user.email.trim() === '') {
          throw new Error('email is required');
        }
      }
    }
  });
  return User;
};