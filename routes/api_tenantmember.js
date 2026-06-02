import models from '../models/index.js';
import { enrichBilingual } from '../libs/bilingual-helper.js';
const Op = models.Sequelize.Op;

/**
 * Display name helper: returns tradingName || user.legalName || '(未設定)'
 * Used in all routes displaying member names.
 */
function getDisplayName(member) {
  if (member.tradingName) return member.tradingName;
  if (member.user && member.user.legalName) return member.user.legalName;
  return '(未設定)';
}

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let id =  req.params.id;
    let include = [
      {
        model: models.MemberClass,
        as: 'memberClass'
      },
      {
        model: models.User,
        as: 'user'
      }
    ];
    if	( !id )	{
      let query = {
        where: { tenantId },
        order: [
          ['tradingName', 'ASC']
        ],
        include: include
      };
      if  ( req.query.memberClassId ) {
        query.where.memberClassId = parseInt(req.query.memberClassId);
      }
      models.TenantMember.findAll(query).then(async (members) => {
        res.json({ members });
      });
    } else {
      models.TenantMember.findOne({
        where: { tenantId, id },
        include: include
      }).then((member) => {
        res.json({
          member,
          displayName: getDisplayName(member)
        });
      });
    }
  },
  post: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    body.tenantId = tenantId;

    // Validation: tradingName required when userId = NULL
    if (!body.userId && (!body.tradingName || body.tradingName.trim() === '')) {
      return res.status(400).json({
        code: -1,
        message: 'ログインしないメンバーには名前（tradingName）が必要です。'
      });
    }

    try {
      const member = await models.TenantMember.create(body);
      res.json({ member });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        code: -1,
        message: e.message || 'DB error at post'
      });
    }
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let member = await models.TenantMember.findOne({ where: { tenantId, id } });
    if	( member )	{
      // Validation: tradingName required when userId = NULL
      if (!member.userId) {
        const newName = body.tradingName !== undefined ? body.tradingName : member.tradingName;
        if (!newName || newName.trim() === '') {
          return res.status(400).json({
            code: -1,
            message: 'ログインしないメンバーには名前（tradingName）が必要です。'
          });
        }
      }
      member.set(body);
      member.tenantId = tenantId;
      member.save().then(() => {
        res.json({ member });
      }).catch((e) => {
        console.log(e);
        res.status(500).json({ code: -1 });
      });
    }
  },
  delete: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let member = await models.TenantMember.findOne({ where: { tenantId, id } });
    if	( member )	{
      member.destroy().then(() => {
        res.json({ code: 0 });
      });
    }
  },
  classes: async (req, res, next) => {
    try {
      let result = await models.MemberClass.findAll();
      const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
      if (lp) {
        result = await enrichBilingual('MemberClass', result, lp);
      }
      res.json({ values: result });
    } catch (e) {
      res.json({ code: -1 });
    }
  },
  getDisplayName
};
