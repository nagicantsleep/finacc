import models from '../models/index.js';
const Op = models.Sequelize.Op;
import {passwd, passport, is_authenticated} from '../libs/user.js';
import {bootstrapTenantMember} from '../libs/bootstrap.js';
import {switchTenant, overlayMembershipPermissions} from '../libs/tenant.js';

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
          const displayName = member.tradingName || (member.user ? member.user.legalName : null);
          users.push({
            id: member.userId,
            name: displayName
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
        'tenantSettings', 'deauthorizedAt', 'isOwner'
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
    const user_name = req.body.user_name;
    const password = req.body.password;
    const legalName = req.body.legalName;
    const email = req.body.email;
    
    // Validate required fields
    if (!user_name || !user_name.trim()) {
      return res.json({
        result: 'NG',
        message: 'ユーザー名を入力してください。'
      });
    }
    
    if (!password || password.length < 8) {
      return res.json({
        result: 'NG',
        message: 'パスワードは8文字以上で入力してください。'
      });
    }
    
    if (!legalName || !legalName.trim()) {
      return res.json({
        result: 'NG',
        message: '氏名を入力してください。'
      });
    }
    
    if (!email || !email.trim()) {
      return res.json({
        result: 'NG',
        message: 'メールアドレスを入力してください。'
      });
    }
    
    // Validate username format (alphanumeric + underscore, 4-20 chars)
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(user_name)) {
      return res.json({
        result: 'NG',
        message: 'ユーザー名は半角英数字とアンダースコア、4〜20文字で入力してください。'
      });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({
        result: 'NG',
        message: '有効なメールアドレスを入力してください。'
      });
    }
    
    try {
      // Check for reserved usernames
      const existingUser = await models.User.check(user_name, password);
      if (existingUser) {
        return res.json({
          result: 'NG',
          message: `ユーザー名「${user_name}」は既に使用されています。`
        });
      }
      
      // Check for email uniqueness
      const existingEmail = await models.User.findOne({
        where: { email: email.trim().toLowerCase() }
      });
      if (existingEmail) {
        return res.json({
          result: 'NG',
          message: 'このメールアドレスは既に登録されています。'
        });
      }
      
      const transaction = await models.sequelize.transaction();
      try {
        let user = new models.User({
          name: user_name.trim(),
          legalName: legalName.trim(),
          email: email.trim().toLowerCase(),
          legalRuby: req.body.legalRuby?.trim() || null,
          legalSex: req.body.legalSex != null ? parseInt(req.body.legalSex, 10) : null,
          birthDate: req.body.birthDate || null,
          telNo: req.body.telNo?.trim() || null,
          zip: req.body.zip?.trim() || null,
          address1: req.body.address1?.trim() || null,
          address2: req.body.address2?.trim() || null
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
          message: err.message || '登録に失敗しました。'
        });
      }
    } catch (err) {
      console.log('signup validation error', err);
      res.json({
        result: 'NG',
        message: typeof err === 'string' ? err : '登録に失敗しました。'
      });
    }
  },
  login:  (req, res, next) => {
    passport.authenticate('local', async (error, user, info) => {
      console.log('login user', user);
      console.log('info', info);
      if (error) {
        return next(error);
      }
      if (!user) {
        return res.json({
          result: 'NG',
          message: info?.message || 'ユーザー名またはパスワードが違います。'
        });
      }
      if (( user.user.deauthorizedAt !== null ) &&
          ( user.user.deauthorizedAt < new Date() )) {
        return res.json({
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

            try {
              // Fetch all active tenant memberships
              const memberships = await models.TenantMember.findAll({
                where: { 
                  userId: user.user.id, 
                  status: 'active' 
                },
                include: [{ 
                  model: models.Tenant, 
                  as: 'tenant',
                  where: { status: 'active' }
                }]
              });

              if (memberships.length === 0) {
                // No memberships — bootstrap personal tenant
                const t = await models.sequelize.transaction();
                try {
                  const result = await bootstrapTenantMember(user.user, t);
                  await t.commit();
                  
                  // Set session tenant
                  req.session.currentTenantId = result.membership.tenantId;
                  overlayMembershipPermissions(req.session.user, result.membership);
                  
                  return res.json({ result: 'OK' });
                } catch (be) {
                  await t.rollback();
                  console.log('tenant bootstrap error on login', be);
                  return res.json({
                    result: 'NG',
                    message: 'テナントの作成に失敗しました。'
                  });
                }
              } else if (memberships.length === 1) {
                // Single tenant — auto-login
                const membership = memberships[0];
                req.session.currentTenantId = membership.tenantId;
                overlayMembershipPermissions(req.session.user, membership);
                
                return res.json({ result: 'OK' });
              } else {
                // Multiple tenants — check for default
                const defaultMembership = memberships.find(m => m.isDefault);
                
                if (defaultMembership) {
                  // Auto-login to default tenant
                  req.session.currentTenantId = defaultMembership.tenantId;
                  overlayMembershipPermissions(req.session.user, defaultMembership);
                  return res.json({ result: 'OK' });
                } else {
                  // No default — require tenant selection
                  return res.json({ 
                    result: 'OK',
                    requiresTenantSelection: true
                  });
                }
              }
            } catch (e) {
              console.log('tenant resolution error', e);
              return res.json({
                result: 'NG',
                message: 'テナントの取得に失敗しました。'
              });
            }
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
      overlayMembershipPermissions(req.session.user, membership);
      res.json({ result: 'OK', tenantId: membership.tenantId });
    } catch (e) {
      res.json({ result: 'NG', message: e.message });
    }
  },
  tenants: async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        result: 'NG',
        message: '認証されていません。'
      });
    }
    
    try {
      const memberships = await models.TenantMember.findAll({
        where: { 
          userId: req.session.user.id, 
          status: 'active' 
        },
        include: [{ 
          model: models.Tenant, 
          as: 'tenant',
          where: { status: 'active' }
        }],
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'ASC']
        ]
      });
      
      const tenants = memberships.map(m => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        tenantSlug: m.tenant.slug,
        isOwner: m.isOwner,
        isDefault: m.isDefault,
        status: m.status
      }));
      
      res.json({
        result: 'OK',
        userName: req.session.user.legalName || req.session.user.name,
        activeTenantId: req.session.currentTenantId || null,
        tenants
      });
    } catch (err) {
      console.error('tenants fetch error', err);
      res.status(500).json({
        result: 'NG',
        message: 'テナントの取得に失敗しました。'
      });
    }
  },
  sessionStatus: async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        result: 'NG',
        authenticated: false,
        message: '認証されていません。'
      });
    }

    try {
      const memberships = await models.TenantMember.findAll({
        where: {
          userId: req.session.user.id,
          status: 'active'
        },
        include: [{
          model: models.Tenant,
          as: 'tenant',
          where: { status: 'active' }
        }]
      });

      res.json({
        result: 'OK',
        authenticated: true,
        activeTenantId: req.session.currentTenantId || null,
        needsTenantSelection: !req.session.currentTenantId,
        membershipCount: memberships.length,
        user: {
          id: req.session.user.id,
          name: req.session.user.name,
          legalName: req.session.user.legalName
        }
      });
    } catch (err) {
      console.error('session status error', err);
      res.status(500).json({
        result: 'NG',
        message: 'セッション状態の取得に失敗しました。'
      });
    }
  },
  profile: async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ result: 'NG', message: '認証されていません。' });
    }
    const userId = req.session.user.id;
    const { legalName, legalRuby, email, telNo } = req.body;

    if (!legalName || !legalName.trim()) {
      return res.json({ result: 'NG', message: '氏名を入力してください。' });
    }
    if (!email || !email.trim()) {
      return res.json({ result: 'NG', message: 'メールアドレスを入力してください。' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ result: 'NG', message: '有効なメールアドレスを入力してください。' });
    }

    try {
      const user = await models.User.findByPk(userId);
      if (!user) return res.status(404).json({ result: 'NG', message: 'ユーザーが見つかりません。' });

      user.legalName = legalName.trim();
      user.legalRuby = legalRuby?.trim() || null;
      user.email = email.trim().toLowerCase();
      user.telNo = telNo?.trim() || null;
      await user.save();

      req.session.user.legalName = user.legalName;
      req.session.user.email = user.email;

      res.json({ result: 'OK' });
    } catch (err) {
      console.error('profile update error', err);
      res.json({ result: 'NG', message: 'プロフィールの更新に失敗しました。' });
    }
  },
  logoff: async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ result: 'NG', message: '認証されていません。' });
    }
    try {
      const memberships = await models.TenantMember.findAll({
        where: { userId: req.session.user.id, status: 'active' },
        include: [{ model: models.Tenant, as: 'tenant', where: { status: 'active' } }]
      });

      if (memberships.length <= 1) {
        // Only one tenant — full logout
        req.logout((err) => {
          req.session.destroy(() => {
            res.json({ result: 'OK', action: 'logout' });
          });
        });
      } else {
        // Multiple tenants — clear current tenant, go to selection
        delete req.session.currentTenantId;
        res.json({ result: 'OK', action: 'select' });
      }
    } catch (err) {
      console.error('logoff error', err);
      res.json({ result: 'NG', message: 'ログオフに失敗しました。' });
    }
  },
  selectTenant: async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        result: 'NG',
        message: '認証されていません。'
      });
    }
    
    const tenantId = parseInt(req.body.tenantId, 10);
    
    if (!tenantId) {
      return res.status(400).json({
        result: 'NG',
        message: 'テナントIDが指定されていません。'
      });
    }
    
    try {
      const membership = await switchTenant(req.session.user.id, tenantId);
      req.session.currentTenantId = membership.tenantId;
      overlayMembershipPermissions(req.session.user, membership);
      
      res.json({ 
        result: 'OK',
        tenantId: membership.tenantId,
        tenantName: membership.tenant.name,
        redirectTo: '/home'
      });
    } catch (err) {
      console.error('tenant selection error', err);
      res.status(403).json({
        result: 'NG',
        message: 'そのテナントへのアクセス権限がありません。'
      });
    }
  }
}