import models from '../models/index.js';
const Op = models.Sequelize.Op;
import CrossSlipDetails from '../libs/crossslipdetails.js';

export default {
  get: (req, res, next) => {
    let id = req.params.id;

    models.CrossSlipDetail.findOne({
      where: {
        id: id,
        tenantId: req.currentTenantId
      }
    }).then((detail) => {
      res.json(detail);
    });
  },
  all: (req, res, next) => {
    const tenantId = req.currentTenantId;
    models.FiscalYear.findOne({
      where: {
        tenantId,
        term: req.params.term
      }
    }).then((fy) => {
  		if	( req.params.sub )	{
      	CrossSlipDetails.all(fy, req.params.acc, paseInt(req.params.sum)).then((result) => {
        	res.json({
          	details: result
        	})
      	});
    	} else {
      	CrossSlipDetails.all(fy. req.params.acc).then((result) => {
          res.json({
            details: result
          })
        })
    	}
    });
  },
  update: (req, res, next) => {
    let detail = req.body;
    console.log('update', detail);
    models.CrossSlipDetail.findOne({
      where: {
        id: detail.id,
        tenantId: req.currentTenantId
      }
    }).then((result) => {
      if ( result ) {
        result.set(detail);
        result.save().then(() => {
          res.json(result);
        });
      }
    });
  }
}
