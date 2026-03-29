import models from '../models/index.js';
const Op = models.Sequelize.Op;
import {passwd, passport, is_authenticated} from '../libs/user.js';
import {bootstrapUserTenant} from '../libs/bootstrap.js';
import {switchTenant} from '../libs/tenant.js';

export default {
  members: (req, res, next) => {
    models.Member.findAll({
      where: {
        userId: {
          [Op.ne]: null
        }
      },
      oeder: [
        ["officialName", "ASC"]
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
            name: member.tradingName ? member.tradingName : member.legalName
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
        model: models.UserTenant,
        as: 'memberships',
        where: { tenantId, status: 'active' },
        attributes: []
      }
    ];
    if (req.query && req.query.nomember) {
      models.User.findAll({
        include: [
          ...baseInclude,
          {
            model: models.Member,
            as: 'member'
          }
        ],
        order: [
          ["name", "ASC"]
        ]
      }).then((_users) => {
        let users = [];
        _users.forEach((user) => {
          if (!user.member) {
            users.push(user);
          }
        });
        res.json({ users });
      });
    } else {
      models.User.findAll({
        include: baseInclude,
        order: [
          ["name", "ASC"]
        ]
      }).then((users) => {
        res.json({ users });
      });
    }
  },
  get: (req, res, next) => {
    let id = req.params.id;
    if  ( id )  {
      models.User.findByPk(id).then((user) => {
        res.json({
          user: user
        });
      });
    } else {
      //console.log(req.session.user);
      res.json({
        user: req.session.user
      });
    }
  },
  update: (req, res, next) => {
    let id = parseInt(req.params.id);
    if  (( req.session.user.id == id) ||
         ( req.session.user.administrable ))    {
      models.User.findByPk(id).then((user) => {
        if  ( req.body.administrable !== undefined )    {
          if  ( user.id != 1 )    {
            user.administrable = req.body.administrable;
          }
        }
        if  ( req.body.accounting !== undefined )   {
          user.accounting = req.body.accounting;
        }
        if  ( req.body.fiscalBrowsing !== undefined )   {
          user.fiscalBrowsing = req.body.fiscalBrowsing;
        }
        if  ( req.body.approvable !== undefined )   {
          user.approvable = req.body.approvable;
        }
        if  ( req.body.inventoryManagement !== undefined )    {
          user.inventoryManagement = req.body.inventoryManagement;
        }
        if  ( req.body.companyManagement !== undefined )    {
          user.companyManagement = req.body.companyManagement;
        }
        if  ( req.body.personnelManagement !== undefined )    {
          user.personnelManagement = req.body.personnelManagement;
        }
        if  ( req.body.deauthorizedAt !== undefined )    {
          user.deauthorizedAt = req.body.deauthorizedAt;
        }
        user.save().then(()=> {
          res.json({ code: 0 });
        }).catch (() => {
          res.json({ code: -1 });
        });
      })
    } else {
      res.json({ status: 'NG'});
    }
  },
  delete: (req, res, next) => {
    let id = parseInt(req.params.id);
    if  (( id != 1 ) &&
         ( req.session.user.administrable ))   {
      models.User.findByPk(id).then((user) => {
        user.destroy().then(() => {
          res.json({ code: 0});
        }).catch (()=> {
          res.json({ code: -1});
        })
      })
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
            name: user_name
          });
          user.password = password;
          const count = await models.User.count({ transaction });
          if	( count === 0 )	{
            user.administrable = true;
            user.accounting = true;
            user.fiscalBrowsing = true;
            user.approvable = true;
            user.companyManagement = true;
            user.inventoryManagement = true;
            user.personnelManagement = true;
          } else {
            user.administrable = false;
            user.accounting = false;
            user.fiscalBrowsing = false;
            user.approvable = false;
            user.companyManagement = false;
            user.inventoryManagement = false;
            user.personnelManagement = false;
          }
          user = await user.save({ transaction });

          await bootstrapUserTenant(user, transaction);

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
              let defaultMembership = await models.UserTenant.findOne({
                where: { userId: user.user.id, isDefault: true, status: 'active' }
              });
              if (!defaultMembership) {
                const t = await models.sequelize.transaction();
                try {
                  const result = await bootstrapUserTenant(user.user, t);
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