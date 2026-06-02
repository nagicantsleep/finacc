import models from '../models/index.js';
import { enrichBilingual } from '../libs/bilingual-helper.js';
const Op = models.Sequelize.Op;

export default {
  get: async(req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    const tenantId = req.currentTenantId;
    let result = {};
    switch  (req.query.type) {
      case  'active':
        result = await models.TaxRule.findAll({
          where: {
            tenantId,
            [Op.and]: [
              {
                [Op.or]: [
                  { startDate: null },
                  { startDate: { [Op.lte]: req.query.date } }
                ]
              },
              { [Op.or]: [
                  { endDate: null },
                  { endDate: { [Op.gte]: req.query.date } }]
              }
            ]
          },
          order: [
            [ 'startDate', 'DESC']
          ]
        });
        break;
      default:
        result = await models.TaxRule.findAll({
          where: { tenantId },
          order: [
            [ 'displayOrder', 'ASC']
          ]
        });
        break;
    }
    const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
    if (lp) {
      result = await enrichBilingual('TaxRule', result, lp);
    }
    res.json({
      values: result
    });
  },
  put: async(req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    const tenantId = req.currentTenantId;
    let taxRules = req.body.values;
    for ( const taxRule of taxRules ) {
      if  ( taxRule.id ) {
        let result = await models.TaxRule.findOne({
          where: { tenantId, id: taxRule.id }
        });
        if  ( !taxRule.label )  {
          await result.destroy();
        } else {
          result.set(taxRule);
          result.tenantId = tenantId;
          await result.save();
        }
      } else {
        await models.TaxRule.create({ ...taxRule, tenantId });
      }
    }
    models.TaxRule.findAll({
      where: { tenantId },
      order: [
        [ 'displayOrder', 'asc']
      ]
    }).then((taxRule) => {
      res.json({
        values: taxRule
      })
    })
  }
}