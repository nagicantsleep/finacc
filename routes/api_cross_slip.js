import models from '../models/index.js';
const Op = models.Sequelize.Op;
import {create as createCrossSlip, update as updateCrossSlip} from '../libs/cross_slip.js';

import * as taxcalc from '../libs/tax-calc.js';

const recalcReject = async (req, res, tenantId) => {
  const body = req.body;
  const year = parseInt(body.year);
  const month = parseInt(body.month);
  const day = parseInt(body.day);
  const dayErr = taxcalc.validateDay(year, month, day);
  if (dayErr) {
    res.status(422).json({ code: -2, message: dayErr });
    return null;
  }
  const ctx = await taxcalc.loadTaxContext(year, month, tenantId);
  if (!ctx.fy) {
    res.status(422).json({ code: -2, message: 'date error' });
    return null;
  }
  const lines = taxcalc.recalcSlipLines(body.lines, ctx);
  const err = taxcalc.validateLines(lines, ctx) || taxcalc.validateBalanced(lines);
  if (err) {
    res.status(422).json({ code: -2, message: err });
    return null;
  }
  body.lines = lines;
  body.term = ctx.fy.term;
  return body;
};

export default {
  list: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    switch  ( req.params.type)  {
      case  'not_approved':
        let where;
        if  ( req.session.user.approvable || req.session.user.accounting ) {
          where = {
            tenantId,
            approvedAt: {
              [Op.eq]: null
            }
          };
        } else {
          where = {
            tenantId,
            approvedAt: {
              [Op.eq]: null
            },
            createdBy: req.session.user.id
          };
        }
        if (req.session.term) {
          where.term = req.session.term;
        }
        let cross_slips = await models.CrossSlip.findAll({
          where: where,
          include: [
            {
              model: models.User,
              as: 'creater'
            }, {
              model: models.User,
              as: 'approver'
            }, {
              model: models.User,
              as: 'updater'
            }, {
              model: models.CrossSlipDetail,
              as: 'lines',
            }
          ],
          order: [
            [ 'year', 'ASC'],
            [ 'month', 'ASC'],
            [ 'day', 'ASC' ],
            [ 'no', 'ASC' ],
            ['lines', 'lineNo', 'ASC']
          ]
        });
        res.json(cross_slips);
        break;
      default:
        break;
    }
  },
  get: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    let year = req.params.year;
    let month = req.params.month;
    let no = req.params.no;

    let cross_slip = await models.CrossSlip.findOne({
      where: {
        [Op.and]: {
          tenantId,
          year: year,
          month: month,
          no: no
        }
      },
      include: [
        {
          model: models.CrossSlipDetail,
          as: 'lines',
          include: [
            {
              model: models.Voucher,
              required: false,
              as: 'debitVoucher',
              where: { tenantId },
              include: [{
                model: models.VoucherFile,
                as: 'files',
                where: { tenantId },
                required: false
              }]
            }, {
              model: models.Voucher,
              required: false,
              as: 'creditVoucher',
              where: { tenantId },
              include: [{
                model: models.VoucherFile,
                as: 'files',
                where: { tenantId },
                required: false
              }]
            }, {
              model: models.TaxRule,
              as: 'debitTaxRule',
              where: { tenantId },
              required: false
            }, {
              model: models.TaxRule,
              as: 'creditTaxRule',
              where: { tenantId },
              required: false
            }, {
              model: models.Project,
              as: 'projectData',
              where: { tenantId },
              required: false
            }]
          },
        {
          model: models.User,
          as: 'creater'
        },
        {
          model: models.User,
          as: 'approver'
        }
      ],
      order: [
        ['lines', 'lineNo', 'ASC']
      ]
    });
    res.json(cross_slip);
  },
  post: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    let body = await recalcReject(req, res, tenantId);
    if (!body) return;
    let slip = await createCrossSlip(body, req.session.user, tenantId);
    if (slip) {
      res.json(slip);
    } else {
      res.status(422).json({
        code: -2,
        message: 'date error'
      });
    }
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = await recalcReject(req, res, tenantId);
    if (!body) return;
    let slip = await models.CrossSlip.findOne({
      where: {
        tenantId,
        year: body.year,
        month: body.month,
        no: body.no
      }
    });
    if (slip) {
      if (!slip.approvedAt) {
        if (req.session.user.accounting || req.session.user.id == slip.createdBy) {
          await updateCrossSlip(slip, body, req.session.user, tenantId);
          res.json({
            code: 0
          });
        } else {
          res.status(403).json({
            code: -10,
            message: 'permission denied'
          });
        }
      } else {
        res.status(422).json({
          code: -2,
          message: 'this slip was approved'
        });
      }
    } else {
      res.status(404).json({
        code: -1,
        message: 'record not found'
      });
    }
  },
  delete: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    if	( req.session.user.approvable )	{
      let body = req.body;
      let slip = await models.CrossSlip.findOne({
        where: {
          tenantId,
          year: body.year,
          month: body.month,
          day: body.day,
          no: body.no
        }
      });
      if	( !slip.approvedAt )	{
        await slip.destroy();
        res.json({
          code: 0,
        });
      } else {
        res.json({
          code: -2,
          message: 'thid slip was approved'
        });
      }
    } else {
      res.json({
        code: -10,
        message: 'this account can not delete'
      });
    }
  },
  approve: (req, res, next) => {
    const tenantId = req.currentTenantId;
    res.set('Access-Control-Allow-Origin', '*');
    if	( req.session.user.approvable )	{
      let body = req.body;
      models.CrossSlip.findOne({
        where: {
          tenantId,
          year: body.year,
          month: body.month,
          no: body.no
        }
      }).then((slip) => {
        slip.approvedAt = body.approvedAt;
        if	( body.approvedAt )	{
          slip.approvedBy = req.session.user.id;
        } else {
          slip.approvedBy = null;
        }
        slip.updatedBy = req.session.user.id;
        slip.save();
        res.json({
          code: 0,
          id: slip.id
        });
      }).catch((e) => {
        res.json({
          code: -1,
          message: 'record not found'
        });
      });
    } else {
      res.json({
        code: -10,
        message: 'this account can not approve'
      });
    }
  }
}
