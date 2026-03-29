import models from '../models/index.js';
const Op = models.Sequelize.Op;
import {print} from '../libs/print.js';
import {DateString} from '../libs/utils.js';

export default {
  get: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = req.params.id;
    const tenantId = req.currentTenantId;
    let include = [
      {
        model: models.Task,
        as: 'task'
      },
      {
        model: models.TransactionDetail,
        as: 'lines',
        include: [
          {
            model: models.TaxRule,
            as: 'taxRule'
          }
        ]
      },
      {
        model: models.User,
        as: 'handleUser',
        attributes: ['name'],
        include: [
          {
            model: models.Member,
            as: 'member',
            attributes: ['legalName', 'tradingName']
          }
        ]
      },
      {
        model: models.Document,
        as: 'document'
      },
      {
        model: models.TransactionKind,
        as: 'kind',
        include: [
          {
            model: models.VoucherClass,
            as: 'book'
          }
        ]
      }
    ];

    try {
      if (!id) {
        let order = [
          ["issueDate", "DESC"],
          ["lines", "lineNo", "ASC"]
        ];
        let where = { tenantId };
        if (!req.query) {
          return res.json({ issueDate: new Date() });
        }
        if (req.query.order && req.query.order === 'asc') {
          order = [
            ["issueDate", "ASC"],
            ["lines", "lineNo", "ASC"]
          ];
        }
        if (req.query.company) {
          include.push({
            model: models.Task,
            as: 'task',
            where: { companyId: parseInt(req.query.company) }
          });
        } else {
          include.push({ model: models.Task, as: 'task' });
        }
        if (req.query.kind) {
          let kind = parseInt(req.query.kind);
          if (kind > 0) {
            where = { [Op.and]: [where, { kindId: kind }] };
          }
        }
        if (req.query.task) {
          where = { [Op.and]: [where, { taskId: parseInt(req.query.task) }] };
        }
        if (req.query.voucher) {
          if (req.query.voucher === 'true') {
            include.push({ model: models.TransactionKind, as: 'kind', where: { hasVoucher: true } });
          } else if (req.query.voucher === 'false') {
            include.push({ model: models.TransactionKind, as: 'kind', where: { hasVoucher: false } });
          } else {
            include.push({ model: models.TransactionKind, as: 'kind' });
          }
        } else {
          include.push({ model: models.TransactionKind, as: 'kind' });
        }
        let transactions = await models.TransactionDocument.findAll({ where, order, include });
        res.json({ code: 0, transactions });
      } else {
        let transaction = await models.TransactionDocument.findOne({
          where: { id, tenantId },
          include
        });
        if (!transaction) {
          return res.status(404).json({ code: -1 });
        }
        if (req.query.print) {
          if (!transaction.voucherId) {
            let companies = await models.Company.findAll({ where: { companyClassId: 1 } });
            const company = companies[0];
            const pdf = await print(req.query.print, { transaction, company });
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdf);
          } else {
            let voucher = await models.Voucher.findOne({
              where: { id: transaction.voucherId, tenantId },
              include: [{ model: models.VoucherFile, as: 'files' }]
            });
            let file;
            for (let _file of voucher.files) {
              if (_file.name === req.query.print) {
                file = _file;
                break;
              }
            }
            if (file) {
              res.setHeader('content-Type', file.mimeType);
              res.send(file.body);
            } else {
              res.status(404).end();
            }
          }
        } else {
          res.json({ code: 0, transaction });
        }
      }
    } catch (err) {
      next(err);
    }
  },
  post: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.session.user.companyManagement) {
      try {
        let body = req.body;
        body.createdBy = req.session.user.id;
        body.updatedBy = req.session.user.id;
        body.tenantId = req.currentTenantId;
        if (!body.no) {
          let fy = await models.FiscalYear.findOne({
            where: { term: req.session.term }
          });
          fy.transactionCount += 1;
          fy.save();
          body.no = `${fy.year}-${fy.transactionCount}`;
        }
        body.id = undefined;
        let document = await models.Document.create({
          issueDate: body.issueDate,
          title: body.subject,
          descriptionType: body.document.descriptionType,
          description: body.document.description,
          handledBy: body.handledBy,
          createdBy: body.createdBy,
          updatedBy: body.updatedBy,
          tenantId: req.currentTenantId
        });
        body.documentId = document.id;
        let transaction = await models.TransactionDocument.create(body);
        for (let i = 0; i < body.lines.length; i++) {
          let line = body.lines[i];
          if ((typeof line.itemId === 'number') || (line.itemName !== '')) {
            line.transactionDocumentId = transaction.id;
            line.lineNo = i;
            line.id = undefined;
            line.tenantId = req.currentTenantId;
            await models.TransactionDetail.create(line);
          }
        }
        res.json({ id: transaction.id, documentId: transaction.documentId });
      } catch (e) {
        console.log(e);
        res.json({ code: -1 });
      }
    } else {
      res.json({ code: -2 });
    }
  },
  update: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let body = req.body;
    body.updatedBy = req.session.user.id;
    let id = req.params.id ? parseInt(req.params.id) : body.id;
    if (req.session.user.companyManagement) {
      try {
        let transaction = await models.TransactionDocument.findOne({
          where: { id, tenantId: req.currentTenantId },
          include: [
            { model: models.Document, as: 'document' },
            { model: models.TransactionKind, as: 'kind' }
          ]
        });
        if (!transaction) {
          return res.status(404).json({ code: -1 });
        }
        let kind = transaction.kind;
        let documentId = transaction.documentId;
        transaction.set({ ...body, tenantId: req.currentTenantId });
        if (kind.hasDetails) {
          await models.TransactionDetail.destroy({
            where: {
              transactionDocumentId: transaction.id,
              tenantId: req.currentTenantId
            }
          });
        }
        let lines = [];
        let _transaction = transaction.dataValues;
        for (let i = 0; i < body.lines.length; i++) {
          let line = body.lines[i];
          if ((typeof line.itemId === 'number') || (line.itemName !== '')) {
            line.transactionDocumentId = transaction.id;
            line.lineNo = i;
            line.id = undefined;
            line.tenantId = req.currentTenantId;
            let _line = await models.TransactionDetail.create(line);
            lines.push(_line.dataValues);
          }
        }
        if ((body.document) && (body.document.descriptionType)) {
          if (documentId) {
            _transaction.document.issueDate = body.issueDate;
            _transaction.document.title = body.subject;
            _transaction.document.descriptionType = body.document.descriptionType;
            _transaction.document.description = body.document.description;
            _transaction.document.handledBy = body.handledBy;
            _transaction.document.createdBy = body.createdBy;
            _transaction.document.updatedBy = body.updatedBy;
            await _transaction.document.save();
          } else {
            let document = await models.Document.create({
              issueDate: body.issueDate,
              title: body.subject,
              descriptionType: body.document.descriptionType,
              description: body.document.description,
              handledBy: body.handledBy,
              createdBy: body.createdBy,
              updatedBy: body.updatedBy,
              tenantId: req.currentTenantId
            });
            transaction.documentId = document.id;
          }
        }
        await transaction.save();
        _transaction.lines = lines;
        res.json({ id: transaction.id, documentId: transaction.documentId });
      } catch (e) {
        console.log(e);
        res.json({ code: -1 });
      }
    } else {
      res.json({ code: -2 });
    }
  },
  delete: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = parseInt(req.params.id);
    if (req.session.user.companyManagement) {
      try {
        let transaction = await models.TransactionDocument.findOne({
          where: { id, tenantId: req.currentTenantId }
        });
        if (transaction) {
          await transaction.destroy();
          res.json({ code: 0 });
        } else {
          res.status(404).json({ code: -1 });
        }
      } catch (e) {
        res.json({ code: -1 });
      }
    } else {
      res.json({ code: -2 });
    }
  },
  allocateReceivable: (req, res, next) => {

  },
  book: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    const transaction = await models.TransactionDocument.findOne({
      where: { id: req.params.id, tenantId },
      include: [
        { model: models.Task, as: 'task' },
        {
          model: models.TransactionDetail,
          as: 'lines',
          include: [{ model: models.TaxRule, as: 'taxRule' }]
        },
        { model: models.Company, as: 'company' },
        {
          model: models.TransactionKind,
          as: 'kind',
          include: [{ model: models.VoucherClass, as: 'book' }]
        },
        {
          model: models.User,
          as: 'handleUser',
          attributes: ['name'],
          include: [{ model: models.Member, as: 'member', attributes: ['legalName', 'tradingName'] }]
        }
      ]
    });
    if (transaction && transaction.kind.forBook) {
      if (transaction.kind.book && transaction.kind.book.form) {
        const company = await models.Company.findOne({ where: { companyClassId: 1 } });
        const pdf = await print(transaction.kind.book.form, { transaction, company });
        let name = `${transaction.companyName}-${transaction.kind.book.form}-${DateString(new Date())} .pdf`;
        if (transaction.voucherId) {
          const voucher = await models.Voucher.findOne({
            where: { id: transaction.voucherId, tenantId },
            include: [{ model: models.VoucherFile, as: 'files' }]
          });
          let file;
          for (let _file of voucher.files) {
            if (_file.name === transaction.kind.book.form) {
              file = _file;
              break;
            }
          }
          if (file) {
            file.mimeType = 'application/pdf';
            file.body = pdf;
            file.name = name;
            file.save();
          } else {
            models.VoucherFile.create({
              voucherId: voucher.id,
              name: name,
              tenantId,
              mimeType: 'application/pdf',
              body: pdf
            });
          }
        } else {
          let rule;
          transaction.lines.forEach(async (line) => {
            if (rule) {
              if (rule.id !== line.taxRule.id) {
                rule = await models.TaxRule.findOne({ where: { taxClass: 9 } });
              }
            } else {
              rule = line.taxRule;
            }
          });
          const voucher = await models.Voucher.create({
            voucherClassId: transaction.kind.bookId,
            issueDate: transaction.issueDate,
            companyId: transaction.companyId,
            amount: transaction.amount,
            tax: transaction.tax,
            taxRule: rule,
            description: transaction.description,
            invoiceNo: transaction.company.invoiceNo,
            createdBy: req.session.user.id,
            updatedBy: req.session.user.id,
            tenantId
          });
          transaction.voucherId = voucher.id;
          await transaction.save();
          await models.VoucherFile.create({
            voucherId: voucher.id,
            name: name,
            tenantId,
            mimeType: 'application/pdf',
            body: pdf
          });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdf);
      }
    }
  },
  kindsGet: (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    models.TransactionKind.findAll({
      order: [['displayOrder', 'asc']]
    }).then((kinds) => {
      res.json({ values: kinds });
    });
  },
  kindsPut: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let kinds = req.body.values;
    for (const kind of kinds) {
      if (kind.id) {
        let result = await models.TransactionKind.findByPk(kind.id);
        if (!kind.label) {
          await result.destroy();
        } else {
          result.set(kind);
          await result.save();
        }
      } else {
        await models.TransactionKind.create(kind);
      }
    }
    models.TransactionKind.findAll({
      order: [['displayOrder', 'asc']]
    }).then((kinds) => {
      res.json({ values: kinds });
    });
  }
};
