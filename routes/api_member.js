import models from '../models/index.js';
const Op = models.Sequelize.Op;

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let id =  req.params.id;
    //console.log('/api/member/', id);
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
      console.log('query', req.query);
      if  ( req.query.memberClassId ) {
        query.where.memberClassId = parseInt(req.query.memberClassId);
      }
      //console.log(JSON.stringify(query, ' ', 2));
      models.TenantMember.findAll(query).then( async(members) => {
        res.json({
          members: members
        });
      });
    } else {
      models.TenantMember.findOne({
        where: { tenantId, id },
        include: include
      }).then((member) => {
        res.json({
          member: member
        });
      });
    }
  },
  post: (req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    body.tenantId = tenantId;
    models.TenantMember.create(body).then((member) => {
      //console.log(member);
      res.json({
        member: member
      });
    }).catch ((e) => {
      console.log(e);
      res.status(500);
      res.json({
        code: -1,
        message: e.message || 'DB error at post'
      })
    });
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let member = await models.TenantMember.findOne({ where: { tenantId, id } });
    if	( member )	{
      member.set(body);
      member.tenantId = tenantId;
      member.save().then(() => {
        res.json({
          member: member
        });
      }).catch((e) => {
        console.log(e);
        res.status(500);
        res.json({
          code: -1
        });
      })
    }
  },
  delete: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let member = await models.TenantMember.findOne({ where: { tenantId, id } });
    if	( member )	{
      member.destroy().then(() => {
        res.json({
          code: 0});
      });
    }
  },
  classes: (req, res, next) => {
    models.MemberClass.findAll().then((result) => {
      res.json({
        values: result
      });
    }).catch((e) => {
      res.json({
        code: -1
      });
    })
  }
};
