import models from '../models/index.js';

export default {
  get: async (req, res, next) => {
    try {
      const labels = await models.Label.findAll({
        where: { tenantId: req.currentTenantId },
        include: [{
          model: models.Account,
          as: 'accounts',
          through: {
            where: { tenantId: req.currentTenantId },
            attributes: ['summaryType']
          }
        }, {
          model: models.Project,
          as: 'projects',
          through: {
            where: { tenantId: req.currentTenantId },
            attributes: []
          }
        }],
        order: [['name', 'ASC']]
      });
      res.json(labels);
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const newLabel = await models.Label.create({
        name,
        description,
        tenantId: req.currentTenantId
      });
      res.status(201).json(newLabel);
    } catch (err) {
      next(err);
    }
  },

  getAccounts: async (req, res, next) => {
    try {
      const label = await models.Label.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (!label) {
        return res.status(404).send('Label not found');
      }
      const accounts = await label.getAccounts({
        through: { where: { tenantId: req.currentTenantId } }
      });
      res.json(accounts);
    } catch (err) {
      next(err);
    }
  },

  updateAccounts: async (req, res, next) => {
    try {
      const label = await models.Label.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (!label) {
        return res.status(404).send('Label not found');
      }
      const labelId = label.id;
      const accounts = req.body.accounts || [];

      await models.LabelAccount.destroy({
        where: { labelId: labelId, tenantId: req.currentTenantId }
      });

      if (accounts.length > 0) {
        const newAssociations = accounts.map(acc => ({
          labelId: labelId,
          accountId: acc.id,
          tenantId: req.currentTenantId,
          summaryType: acc.summaryType
        }));
        await models.LabelAccount.bulkCreate(newAssociations);
      }
      res.status(200).send();
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const label = await models.Label.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (!label) {
        return res.status(404).send('Label not found');
      }
      await label.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const label = await models.Label.findOne({
        where: { id: req.params.id, tenantId: req.currentTenantId }
      });
      if (!label) {
        return res.status(404).send('Label not found');
      }
      const { name, description } = req.body;
      await label.update({ name, description });
      res.json(label);
    } catch (err) {
      next(err);
    }
  },
};
