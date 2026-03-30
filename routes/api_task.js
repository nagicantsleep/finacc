import models from '../models/index.js';
const Op = models.Sequelize.Op;

export default {
  get: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = req.params.id;
    const tenantId = req.currentTenantId;
    let include = [
      {
        model: models.Company,
        as: 'company',
        where: { tenantId },
        required: false
      },
      {
        model: models.TaskDetail,
        as: 'lines',
        where: { tenantId },
        required: false,
        include: [
          {
            model: models.TaxRule,
            as: 'taxRule',
            where: { tenantId },
            required: false
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
            where: { tenantId },
            required: false,
            attributes: ['legalName', 'tradingName']
          }
        ]
      },
      {
        model: models.Document,
        as: 'document',
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
            ["issueDate", "DESC"],
            ["companyId", "ASC"]
          ];
        }
        if (req.query.company) {
          where = { [Op.and]: [where, { companyId: parseInt(req.query.company) }] };
        }
        let tasks = await models.Task.findAll({ where, order, include });
        res.json({ code: 0, tasks });
      } else {
        let task = await models.Task.findOne({
          where: { id, tenantId },
          include,
          order: [["lines", "lineNo", "ASC"]]
        });
        res.json({ code: 0, task });
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
        body.id = undefined;
        body.tenantId = req.currentTenantId;
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
        let task = await models.Task.create(body);
        let lines = [];
        for (let i = 0; i < body.lines.length; i++) {
          let line = body.lines[i];
          if ((typeof line.itemId === 'number') || (line.itemName !== '')) {
            line.taskId = task.id;
            line.lineNo = i;
            line.id = undefined;
            line.tenantId = req.currentTenantId;
            line = await models.TaskDetail.create(line);
            lines.push(line.dataValues);
          }
        }
        let _task = task.dataValues;
        _task.document = document.dataValues;
        _task.lines = lines;
        res.json({ task: _task });
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
        let task = await models.Task.findOne({
          where: { id, tenantId: req.currentTenantId },
          include: [{ model: models.Document, as: 'document' }]
        });
        if (!task) {
          return res.status(404).json({ code: -1 });
        }
        task.set({ ...body, tenantId: req.currentTenantId });
        await task.save();
        await models.TaskDetail.destroy({
          where: {
            taskId: task.id,
            tenantId: req.currentTenantId
          }
        });
        let lines = [];
        for (let i = 0; i < body.lines.length; i++) {
          let line = body.lines[i];
          if ((typeof line.itemId === 'number') || (line.itemName !== '')) {
            line.taskId = task.id;
            line.lineNo = i;
            line.id = undefined;
            line.tenantId = req.currentTenantId;
            let _line = await models.TaskDetail.create(line);
            lines.push(_line.dataValues);
          }
        }
        task.document.issueDate = body.issueDate;
        task.document.title = body.subject;
        task.document.descriptionType = body.document.descriptionType;
        task.document.description = body.document.description;
        task.document.handledBy = body.handledBy;
        task.document.createdBy = body.createdBy;
        task.document.updatedBy = body.updatedBy;
        await task.document.save();
        task.dataValues.lines = lines;
        res.json({ task });
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
      await models.Task.destroy({
        where: {
          id,
          tenantId: req.currentTenantId
        }
      });
      res.json({ code: 0 });
    } else {
      res.json({ code: -2 });
    }
  }
};
