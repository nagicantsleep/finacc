import models from '../models/index.js';
import fs from 'fs';
const Op = models.Sequelize.Op;
import {getCompanyInfo, putCompanyInfo} from '../libs/utils.js';

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    if (!tenantId) return res.status(401).json({ code: -1, message: 'Unauthorized' });
    let id =  req.params.id;
    console.log('/api/company/', id);
		let include = [
      {
        model: models.CompanyClass,
        as: 'companyClass'
      }
    ];
    if	( !id )	{
      let where = { tenantId };
      if	( req.query )	{
        if	( req.query.kind )	{
          let kind = parseInt(req.query.kind);
          if	( kind > 0 )	{
            where.companyClassId = kind;
          }
        }
        if  ( req.query.clientOnly )  {
          include[0].where = {
            isClient: true
          };
        }
      }
      let pr;
      if	( where )	{
      	pr = models.Company.findAll({
        	order: [
          	['name', 'ASC']
        	],
        	include: include,
          where: where
        });
      } else {
      	pr = models.Company.findAll({
        	order: [
          	['name', 'ASC']
        	],
        	include: include,
          where: { tenantId }
        });
      }
      pr.then((companies) => {
        res.json({
          code: 0,
          companies: companies
      	});
      });
    } else {
      models.Company.findOne({
        where: {
          tenantId,
          id: id
        },
        include: include
      }).then((company) => {
        res.json({
          code: 0,
          company: company
        });
      });
    }
  },
  post: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    body.tenantId = tenantId;

    let company = await models.Company.create(body)
    
    res.json({
      id: company.id
    });
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let company = await models.Company.findOne({
      where: {
        tenantId,
        id: id
      }
    });
    if	( company )	{
      company.set(body);
      company.tenantId = tenantId;
      company.save().then(() => {
        res.json(company);
      });
    }
  },
  delete: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let company = await models.Company.findOne({
      where: {
        tenantId,
        id: id
      }
    });
    if	( company )	{
      company.destroy().then(() => {
        res.json({
          code: 0});
      });
    }
  },
  kindsGet: (req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    models.CompanyClass.findAll({
      where: { tenantId },
      order: [
        [ 'displayOrder', 'asc']
      ]
    }).then((kinds) => {
      res.json({
        values: kinds
      })
    })
  },
  kindsPut: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    let kinds = req.body.values;
    for ( const kind of kinds ) {
      if  ( kind.id ) {
        let result = await models.CompanyClass.findOne({ where: { tenantId, id: kind.id } });
        if  ( !kind.name )  {
          await result.destroy();
        } else {
          result.set(kind);
          result.tenantId = tenantId;
          await result.save();
        }
      } else {
        await models.CompanyClass.create({ ...kind, tenantId });
      }
    }
    models.CompanyClass.findAll({
      where: { tenantId },
      order: [
        [ 'displayOrder', 'asc']
      ]
    }).then((kinds) => {
      res.json({
        values: kinds
      })
    })
  },
  infoGet: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let company = await getCompanyInfo(req.currentTenantId);
    res.json({
      company: company
    });
  },
  infoPut: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    await putCompanyInfo(req.body, req.currentTenantId);
    res.json({
      code: 0
    });
  }
};
