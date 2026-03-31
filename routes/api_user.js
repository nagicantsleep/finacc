import models from '../models/index.js';
const Op = models.Sequelize.Op;
import {passwd, passport, is_authenticated} from '../libs/user.js';
import {bootstrapTenantMember} from '../libs/bootstrap.js';
import {switchTenant} from '../libs/tenant.js';

export default {
  members: (req, res, next) => {
    const tenantId = req.currentTenantId;
    models.TenantMember.findAll({
      where: {
        tenantId,
        userId: {
          [Op.ne]: null
        }
      },
      order: [
        ["tradingName", "ASC"]
      ],
      include: [
        {
          model: models.User,
          as: 'user'
        }
      ]
    }).then((members) => {
      let users = [];
      for ( let member of members ) {
        if  ( member.userId ) {
          users.push({
            id: member.userId,
            name: member.tradingName ? member.tradingName : (member.user ? member.user.legalName : null)
          })
        }
      }
      res.json({
        users: users
      });
    })
  },
  list: (req, res, next) => {
    const tenantId = req.currentTenantId;
    const baseInclude = [
      {
        model: models.TenantMember,
        as: 'memberships',
        where: { tenantId, status: 'active' },
        attributes: []
      }
    ];
    models.User.findAll({
      include: baseInclude,
      order: [
        ["name", "ASC"]
      ]
    }).then((users) => {
      res.json({ users });
    });
  },
  get: async (req, res, next) => {
    let id = req.params.id;
    if  ( id )  {
      const membership = await models.TenantMember.findOne({
        where: { userId: id, tenantId: req.currentTenantId, status: 'active' },
        include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email', 'deauthorizedAt'] }]
      });
      if (!membership) return res.status(404).json({ code: -1 });
      res.json({ user: membership.user, membership });
    } else {
      res.json({
        user: req.session.user
      });
    }
  },
  update: async (req, res, next) => {
    let id = parseInt(req.params.id);
    if  (( req.session.user.id == id) ||
         ( req.session.user.administrable ))    {
      const membership = await models.TenantMember.findOne({
        where: { userId: id, tenantId: req.currentTenantId, status: 'active' }
      });
      if (!membership) return res.status(404).json({ code: -1 });
      const PERMISSION_FIELDS = [
        'administrable', 'accounting', 'fiscalBrowsing', 'approvable',
        'inventoryManagement', 'companyManagement', 'personnelManagement',
        'deauthorizedAt', 'isOwner'
      ];
      for (const field of PERMISSION_FIELDS) {
        if (req.body[field] !== undefined) {
          membership[field] = req.body[field];
        }
      }
      membership.save().then(() => {
        res.json({ code: 0 });
      }).catch(() => {
        res.json({ code: -1 });
      });
    } else {
      res.json({ status: 'NG'});
    }
  },
  delete: async (req, res, next) => {
    let id = parseInt(req.params.id);
    if  (( id != 1 ) &&
         ( req.session.user.administrable ))   {
      const membership = await models.TenantMember.findOne({
        where: { userId: id, tenantId: req.currentTenantId, status: 'active' }
      });
      if (!membership) return res.status(404).json({ code: -1 });
      membership.status = 'inactive';
      membership.save().then(() => {
        res.json({ code: 0 });
      }).catch(() => {
        res.json({ code: -1 });
      });
    } else {
      res.json({ code: -2});
    }
  },
  post: (req, res, next) => {

  },
  password: (req, res, next) => {
    let body = req.body;
    let user_name = req.session.user.name;
    passwd(user_name, body.currentPassword, body.newPassword).then((flag) => {
      res.json({
        result: flag ? 'OK' : 'NG'
      });
    })
  },
  signup: async (req, res, next) => {
    let user_name = req.body.user_name;
    let password = req.body.password;
    let legalName = req.body.legalName || user_name;
    let email = req.body.email || `${user_name}@localhost`;
    
    models.User.check(user_name, password).then(async (_user) => {
      if  ( _user) {
        res.json({
          result: 'NG',
          message: `ユーザー名 ${user_name} は既に登録されています。`
        });
      } else {
        const transaction = await models.sequelize.transaction();
        try {
          let user = new models.User({
            name: user_name,
            legalName: legalName,
            email: email,
            legalRuby: req.body.legalRuby || null,
            legalSex: req.body.legalSex || null,
            birthDate: req.body.birthDate || null,
            telNo: req.body.telNo || null,
            zip: req.body.zip || null,
            address1: req.body.address1 || null,
            address2: req.body.address2 || null
          });
          user.password = password;
          user = await user.save({ transaction });

          await bootstrapTenantMember(user, transaction);

          await transaction.commit();
          res.json({
            result: 'OK'
          });
        } catch (err) {
          await transaction.rollback();
          console.log('signup error', err);
          res.json({
            result: 'NG',
            message: err.message || err
          });
        }
      }
    }).catch((err) => {
      console.log(err);
      res.json({
        result: 'NG',
        message: err
      });
    });
  },
  login:  (req, res, next) => {
    passport.authenticate('local', async (error, user, info) => {
      console.log('login user', user);
      console.log('info', info);
      if (error) {
        return next(error);
      }
      if (( !user ) ||
          (( user.user.deauthorizedAt !== null ) &&
           ( user.user.deauthorizedAt < new Date() )) ) {
        res.json({
          result: 'NG',
          message: `user ${user.user_name} not found`
        });
      } else {
        req.login(user, async (error) => {
          console.log('/login user', user);
          console.log("error", error);
          if (error) {
            res.json({
              result: 'NG',
              message: `user ${user.user_name} not found`
            });
          } else {
            req.session.user = user.user;

            // Resolve default tenant — silently bootstrap one if none exists.
            try {
              let defaultMembership = await models.TenantMember.findOne({
                where: { userId: user.user.id, isDefault: true, status: 'active' }
              });
              if (!defaultMembership) {
                const t = await models.sequelize.transaction();
                try {
                  const result = await bootstrapTenantMember(user.user, t);
                  await t.commit();
                  defaultMembership = result.membership;
                } catch (be) {
                  await t.rollback();
                  console.log('tenant bootstrap error on login', be);
                }
              }
              if (defaultMembership) {
                req.session.currentTenantId = defaultMembership.tenantId;
              }
            } catch (e) {
              console.log('tenant resolution error', e);
            }

            res.json({
              result: 'OK'
            });
          }
        });
      }
    })(req, res, next);
  },
  switchTenant: async (req, res, next) => {
    const tenantId = parseInt(req.body.tenantId);
    if (!tenantId) {
      return res.json({ result: 'NG', message: 'tenantId required' });
    }
    try {
      const membership = await switchTenant(req.session.user.id, tenantId);
      req.session.currentTenantId = membership.tenantId;
      res.json({ result: 'OK', tenantId: membership.tenantId });
    } catch (e) {
      res.json({ result: 'NG', message: e.message });
    }
  }
}