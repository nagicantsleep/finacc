import models from '../models/index.js';
import fs from 'fs';
import Mime from 'mime';
const Op = models.Sequelize.Op;

const getFiles = async (voucherId, tenantId) => {
  let files = await models.VoucherFile.findAll({
    where: {
      voucherId,
      tenantId
    },
    attributes: {
      exclude: ['body']
    }
  });
  for (let i = 0; i < files.length; i += 1) {
    if (files[i].mimeType.match(/^image\//)) {
      let file = await models.VoucherFile.findOne({
        where: {
          id: files[i].id,
          tenantId
        },
        attributes: {
          include: ['body']
        }
      });
      files[i].body = file.body.toString('base64');
    } else {
      files[i].body = '';
    }
  }
  return files;
};

export default {
  get: async (req, res, next) => {
    let id = req.params.id;
    const tenantId = req.currentTenantId;
    let include = [
      {
        model: models.Company,
        as: 'company',
        where: { tenantId },
        required: false
      }, {
        model: models.User,
        as: 'updateUser'
      }, {
        model: models.VoucherClass,
        as: 'voucherClass',
        where: { tenantId },
        required: false
      }, {
        model: models.TaxRule,
        as: 'taxRule',
        where: { tenantId },
        required: false
      }
    ];

    try {
      if (!id) {
        let order;
        let where = { tenantId };
        if (req.query.order) {
          order = req.params.order;
        } else {
          order = [
            ["issueDate", "ASC"]
          ];
        }
        if (req.query.date) {
          let date = new Date(req.query.date);
          where = {
            [Op.and]: [where, {
              [Op.or]: [
                { issueDate: { [Op.eq]: date } },
                { paymentDate: { [Op.eq]: date } }
              ]
            }]
          };
        } else if (req.query.month) {
          let ymd = req.query.month.split('-');
          let fromDate = new Date(parseInt(ymd[0]), parseInt(ymd[1]) - 1, 1);
          let toDate = new Date(parseInt(ymd[0]), parseInt(ymd[1]), 1);
          where = {
            [Op.and]: [where, {
              [Op.or]: [
                {
                  [Op.and]: [
                    { issueDate: { [Op.gte]: fromDate } },
                    { issueDate: { [Op.lt]: toDate } }
                  ]
                },
                {
                  [Op.and]: [
                    { paymentDate: { [Op.gte]: fromDate } },
                    { paymentDate: { [Op.lt]: toDate } }
                  ]
                }
              ]
            }]
          };
        } else {
          let fy = await models.FiscalYear.findOne({
            where: {
              tenantId,
              term: req.session.term
            }
          });
          where = {
            [Op.and]: [
              where,
              { issueDate: { [Op.gte]: new Date(fy.startDate) } },
              { issueDate: { [Op.lte]: new Date(fy.endDate) } }
            ]
          };
        }
        if (req.query.type) {
          let type = parseInt(req.query.type);
          if (type > 0) {
            where = { [Op.and]: [where, { voucherClassId: type }] };
          }
        }
        if (req.query.company) {
          where = { [Op.and]: [where, { companyId: parseInt(req.query.company) }] };
        }
        if (req.query.upper) {
          if (req.query.lower) {
            where = {
              [Op.and]: [where,
                { amount: { [Op.gte]: parseInt(req.query.lower) } },
                { amount: { [Op.lte]: parseInt(req.query.upper) } }
              ]
            };
          } else {
            where = { [Op.and]: [where, { amount: { [Op.lte]: parseInt(req.query.upper) } }] };
          }
        } else if (req.query.lower) {
          where = { [Op.and]: [where, { amount: { [Op.gte]: parseInt(req.query.lower) } }] };
        }

        let _vouchers = await models.Voucher.findAll({
          where,
          order,
          include,
          distinct: true
        });
        let vouchers = [];
        for (let i = 0; i < _vouchers.length; i += 1) {
          let voucher = _vouchers[i].dataValues;
          let files = await getFiles(voucher.id, tenantId);
          voucher.files = files;
          let details = await models.CrossSlipDetail.findAll({
            where: {
              tenantId,
              [Op.or]: [
                { debitVoucherId: voucher.id },
                { creditVoucherId: voucher.id }
              ]
            },
            include: [
              { model: models.CrossSlip, as: 'crossSlip' }
            ]
          });
          voucher.details = details;
          vouchers.push(voucher);
        }
        res.json({ code: 0, vouchers });
      } else {
        let _voucher = await models.Voucher.findOne({
          where: { id, tenantId },
          include
        });
        let voucher = _voucher.dataValues;
        let details = await models.CrossSlipDetail.findAll({
          where: {
            tenantId,
            [Op.or]: [
              { debitVoucherId: voucher.id },
              { creditVoucherId: voucher.id }
            ]
          },
          include: [{ model: models.CrossSlip, as: 'crossSlip' }]
        });
        voucher.details = details;
        res.json({ code: 0, voucher });
      }
    } catch (err) {
      next(err);
    }
  },
  post: async (req, res, next) => {
    try {
      let body = req.body;
      body.createdBy = req.session.user.id;
      body.updatedBy = req.session.user.id;
      body.tenantId = req.currentTenantId;
      let voucher = await models.Voucher.create(body);
      res.json({ code: 0, voucher });
    } catch (e) {
      res.json({ code: -1 });
    }
  },
  update: async (req, res, next) => {
    try {
      let body = req.body;
      body.updatedBy = req.session.user.id;
      let id = req.params.id ? req.params.id : body.id;
      let voucher = await models.Voucher.findOne({
        where: { id, tenantId: req.currentTenantId }
      });
      if (voucher) {
        voucher.set({ ...body, tenantId: req.currentTenantId });
        await voucher.save();
        res.json({ voucher });
      } else {
        res.status(404).json({ code: -1 });
      }
    } catch (e) {
      res.json({ code: -1 });
    }
  },
  delete: async (req, res, next) => {
    try {
      let body = req.body;
      let id = req.params.id ? req.params.id : body.id;
      let voucher = await models.Voucher.findOne({
        where: { id, tenantId: req.currentTenantId }
      });
      if (voucher) {
        await voucher.destroy();
        res.json({ code: 0 });
      } else {
        res.status(404).json({ code: -2 });
      }
    } catch (err) {
      res.json({ code: -1 });
    }
  },
  upload: (req, res, next) => {
    let voucher_id = req.params.id ? parseInt(req.params.id) : null;
    let name = req.files.file.name;
    let tmp_name = req.files.file.path;
    let body = fs.readFileSync(tmp_name);
    let mime_type = Mime.getType(tmp_name);
    models.VoucherFile.create({
      name: name,
      voucherId: voucher_id,
      tenantId: req.currentTenantId,
      mimeType: mime_type,
      body: body
    }).then((ret) => {
      ret.body = ret.body.toString('base64');
      res.json({ code: 0, file: ret });
    }).catch((err) => {
      res.json({ code: -1 });
    });
  },
  files: async (req, res, next) => {
    let id = parseInt(req.params.id);
    if (id) {
      let files = await getFiles(id, req.currentTenantId);
      res.json(files);
    }
  },
  bind: async (req, res, next) => {
    let body = req.body;
    const tenantId = req.currentTenantId;
    try {
      const file = await models.VoucherFile.findOne({
        where: { id: body.id, tenantId }
      });
      if (!file) return res.status(404).json({ code: -1 });
      const voucher = await models.Voucher.findOne({
        where: { id: body.voucherId, tenantId }
      });
      if (!voucher) return res.status(403).json({ code: -3 });
      file.voucherId = body.voucherId;
      await file.save();
      res.json({ code: 0 });
    } catch (e) {
      console.log('error', e);
      res.json({ code: -1 });
    }
  },
  deleteFile: (req, res, next) => {
    let id = parseInt(req.body.id);
    models.VoucherFile.findOne({
      where: { id, tenantId: req.currentTenantId }
    }).then((file) => {
      file.destroy().then(() => {
        res.json({ code: 0 });
      }).catch((e) => {
        res.json({ code: -1 });
      });
    }).catch((e) => {
      res.json({ code: -1 });
    });
  },
  classesGet: (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    const tenantId = req.currentTenantId;
    models.VoucherClass.findAll({
      where: { tenantId },
      order: [['displayOrder', 'asc']]
    }).then((classes) => {
      res.json({ values: classes });
    });
  },
  classesPut: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    const tenantId = req.currentTenantId;
    let kinds = req.body.values;
    for (const kind of kinds) {
      if (kind.id) {
        let result = await models.VoucherClass.findOne({
          where: { tenantId, id: kind.id }
        });
        if (!kind.name) {
          await result.destroy();
        } else {
          result.set(kind);
          await result.save();
        }
      } else {
        await models.VoucherClass.create({ ...kind, tenantId });
      }
    }
    models.VoucherClass.findAll({
      where: { tenantId },
      order: [['displayOrder', 'asc']]
    }).then((kinds) => {
      res.json({ values: kinds });
    });
  }
};
