import models from '../models/index.js';

export default {
  get: async (req, res, next) => {
    const id = req.params.id;
    const tenantId = req.currentTenantId;
    try {
      if (id) {
        const project = await models.Project.findOne({
          where: { id, tenantId }
        });
        if (project) {
          res.json(project);
        } else {
          res.status(404).send('Project not found');
        }
      } else {
        const projects = await models.Project.findAll({
          where: { tenantId },
          order: [['code', 'ASC']]
        });
        res.json(projects);
      }
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, code, startDate, endDate } = req.body;
      const project = await models.Project.create({
        name,
        code,
        startDate,
        endDate,
        tenantId: req.currentTenantId
      });
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const project = await models.Project.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (project) {
        const { name, code, startDate, endDate } = req.body;
        await project.update({ name, code, startDate, endDate });
        res.json(project);
      } else {
        res.status(404).send('Project not found');
      }
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const project = await models.Project.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (project) {
        await project.destroy();
        res.status(204).send();
      } else {
        res.status(404).send('Project not found');
      }
    } catch (err) {
      next(err);
    }
  },

  getLabels: async (req, res, next) => {
    try {
      const project = await models.Project.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (!project) {
        return res.status(404).send('Project not found');
      }
      const labels = await project.getLabels({
        through: {
          where: { tenantId: req.currentTenantId },
          attributes: ['displayOrder']
        },
        order: [
          [models.sequelize.literal('"ProjectLabels"."displayOrder"'), 'ASC']
        ]
      });
      res.json(labels);
    } catch (err) {
      next(err);
    }
  },

  updateLabels: async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const project = await models.Project.findOne({
        where: { id: projectId, tenantId: req.currentTenantId }
      });
      if (!project) {
        return res.status(404).send('Project not found');
      }

      const labelsData = req.body.labels || [];

      await models.ProjectLabel.destroy({
        where: { projectId: projectId, tenantId: req.currentTenantId }
      });

      if (labelsData.length > 0) {
        const newAssociations = labelsData.map(item => ({
          projectId: projectId,
          labelId: item.labelId,
          displayOrder: item.displayOrder,
          tenantId: req.currentTenantId
        }));
        await models.ProjectLabel.bulkCreate(newAssociations);
      }

      res.status(200).send();
    } catch (err) {
      next(err);
    }
  }
};
