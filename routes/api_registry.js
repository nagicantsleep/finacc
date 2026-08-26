import express from 'express';
import models from '../models/index.js';
import { is_authenticated } from '../libs/user.js';
import { requireTenant } from '../libs/tenant.js';

const router = express.Router();
const Op = models.Sequelize.Op;

router.use(is_authenticated, requireTenant);

/**
 * Validate entry data payload against definition schema fields
 */
function validateEntryData(schema, data) {
  const errors = [];
  if (!schema || !Array.isArray(schema.fields)) return errors;

  for (const field of schema.fields) {
    const val = data[field.key];
    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push(`Field '${field.label || field.key}' is required.`);
      continue;
    }
    if (val !== undefined && val !== null && val !== '') {
      if (field.type === 'number' && isNaN(Number(val))) {
        errors.push(`Field '${field.label || field.key}' must be a valid number.`);
      }
      if (field.type === 'date' && isNaN(Date.parse(val))) {
        errors.push(`Field '${field.label || field.key}' must be a valid date.`);
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Registry Definitions
// ---------------------------------------------------------------------------

// List definitions
router.get('/definitions', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const definitions = await models.RegistryDefinition.findAll({
      where: { tenantId, status: 'active' },
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'ASC']
      ],
      include: [
        {
          model: models.RegistryEntry,
          as: 'entries',
          attributes: ['id']
        }
      ]
    });

    const results = definitions.map(d => {
      const plain = d.toJSON();
      plain.entryCount = plain.entries ? plain.entries.length : 0;
      delete plain.entries;
      return plain;
    });

    res.json({ code: 0, definitions: results });
  } catch (e) {
    console.error('Error in GET /api/registry/definitions:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create definition
router.post('/definitions', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { name, code, description, icon, schema, layout, displayOrder } = req.body;

    if (!name || !code) {
      return res.status(400).json({ code: -1, message: 'Name and Code are required.' });
    }

    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    // Check duplicate code
    const existing = await models.RegistryDefinition.findOne({
      where: { tenantId, code: cleanCode }
    });
    if (existing) {
      return res.status(409).json({ code: -1, message: `Registry code '${cleanCode}' already exists.` });
    }

    const definition = await models.RegistryDefinition.create({
      tenantId,
      name,
      code: cleanCode,
      description: description || '',
      icon: icon || 'bi-journal-bookmark',
      status: 'active',
      schema: schema || { fields: [] },
      layout: layout || {},
      displayOrder: displayOrder || 0
    });

    res.json({ code: 0, definition });
  } catch (e) {
    console.error('Error in POST /api/registry/definitions:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Get single definition
router.get('/definitions/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const definition = await models.RegistryDefinition.findOne({
      where: { id, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    res.json({ code: 0, definition });
  } catch (e) {
    console.error('Error in GET /api/registry/definitions/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Update definition
router.put('/definitions/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);
    const { name, description, icon, status, schema, layout, displayOrder } = req.body;

    const definition = await models.RegistryDefinition.findOne({
      where: { id, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    if (name) definition.name = name;
    if (description !== undefined) definition.description = description;
    if (icon) definition.icon = icon;
    if (status) definition.status = status;
    if (schema) definition.schema = schema;
    if (layout) definition.layout = layout;
    if (displayOrder !== undefined) definition.displayOrder = displayOrder;

    await definition.save();
    res.json({ code: 0, definition });
  } catch (e) {
    console.error('Error in PUT /api/registry/definitions/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Delete definition (soft-archive or delete if empty)
router.delete('/definitions/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const definition = await models.RegistryDefinition.findOne({
      where: { id, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    const entryCount = await models.RegistryEntry.count({
      where: { tenantId, registryDefinitionId: id }
    });

    if (entryCount > 0) {
      definition.status = 'archived';
      await definition.save();
      return res.json({ code: 0, message: 'Registry archived.', archived: true });
    } else {
      await definition.destroy();
      return res.json({ code: 0, message: 'Registry deleted.', deleted: true });
    }
  } catch (e) {
    console.error('Error in DELETE /api/registry/definitions/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Registry Entries
// ---------------------------------------------------------------------------

// List entries for a definition
router.get('/entries/:defId', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const defId = parseInt(req.params.defId, 10);
    const { q, status, companyId, limit, offset } = req.query;

    const definition = await models.RegistryDefinition.findOne({
      where: { id: defId, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    const where = { tenantId, registryDefinitionId: defId };
    if (status && status !== 'all') {
      where.status = status;
    }
    if (companyId) {
      where.companyId = parseInt(companyId, 10);
    }
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: search } },
        { code: { [Op.iLike]: search } }
      ];
    }

    const entries = await models.RegistryEntry.findAndCountAll({
      where,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
      order: [['createdAt', 'DESC']],
      include: [
        { model: models.Company, as: 'company', attributes: ['id', 'name'] },
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName'] },
        { model: models.User, as: 'creator', attributes: ['id', 'name', 'legalName'] }
      ]
    });

    res.json({
      code: 0,
      definition,
      total: entries.count,
      entries: entries.rows
    });
  } catch (e) {
    console.error('Error in GET /api/registry/entries/:defId:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create entry
router.post('/entries/:defId', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const defId = parseInt(req.params.defId, 10);
    const { title, data, companyId, assignedUserId, status, code } = req.body;

    const definition = await models.RegistryDefinition.findOne({
      where: { id: defId, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ code: -1, message: 'Title is required.' });
    }

    const payloadData = data || {};
    const validationErrors = validateEntryData(definition.schema, payloadData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ code: -1, message: validationErrors.join(' ') });
    }

    let entryCode = code;
    if (!entryCode) {
      const count = await models.RegistryEntry.count({
        where: { tenantId, registryDefinitionId: defId }
      });
      entryCode = `${definition.code.toUpperCase()}-${String(count + 1).padStart(4, '0')}`;
    }

    const entry = await models.RegistryEntry.create({
      tenantId,
      registryDefinitionId: defId,
      code: entryCode,
      title: title.trim(),
      data: payloadData,
      companyId: companyId ? parseInt(companyId, 10) : null,
      userId: assignedUserId ? parseInt(assignedUserId, 10) : null,
      status: status || 'open',
      createdById: userId,
      updatedById: userId
    });

    await models.RegistryTimeline.create({
      tenantId,
      registryEntryId: entry.id,
      action: 'create',
      comment: 'Bản ghi được tạo mới.',
      changes: { initialData: payloadData },
      authorId: userId
    });

    res.json({ code: 0, entry });
  } catch (e) {
    console.error('Error in POST /api/registry/entries/:defId:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Get single entry with details and timeline
router.get('/entry/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const entry = await models.RegistryEntry.findOne({
      where: { id, tenantId },
      include: [
        { model: models.RegistryDefinition, as: 'definition' },
        { model: models.Company, as: 'company' },
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
        { model: models.User, as: 'creator', attributes: ['id', 'name', 'legalName'] },
        {
          model: models.RegistryTimeline,
          as: 'timelines',
          include: [{ model: models.User, as: 'author', attributes: ['id', 'name', 'legalName'] }]
        }
      ],
      order: [[{ model: models.RegistryTimeline, as: 'timelines' }, 'createdAt', 'DESC']]
    });

    if (!entry) {
      return res.status(404).json({ code: -1, message: 'Registry entry not found.' });
    }

    res.json({ code: 0, entry });
  } catch (e) {
    console.error('Error in GET /api/registry/entry/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Update entry
router.put('/entry/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const id = parseInt(req.params.id, 10);
    const { title, data, companyId, assignedUserId, status, comment } = req.body;

    const entry = await models.RegistryEntry.findOne({
      where: { id, tenantId },
      include: [{ model: models.RegistryDefinition, as: 'definition' }]
    });

    if (!entry) {
      return res.status(404).json({ code: -1, message: 'Registry entry not found.' });
    }

    const payloadData = data !== undefined ? data : entry.data;
    if (entry.definition && entry.definition.schema) {
      const validationErrors = validateEntryData(entry.definition.schema, payloadData);
      if (validationErrors.length > 0) {
        return res.status(400).json({ code: -1, message: validationErrors.join(' ') });
      }
    }

    const changes = {};
    if (title && title !== entry.title) {
      changes.title = { from: entry.title, to: title };
      entry.title = title.trim();
    }
    if (status && status !== entry.status) {
      changes.status = { from: entry.status, to: status };
      entry.status = status;
    }
    if (data !== undefined) {
      changes.data = { from: entry.data, to: data };
      entry.data = data;
    }
    if (companyId !== undefined) {
      const newComp = companyId ? parseInt(companyId, 10) : null;
      if (newComp !== entry.companyId) {
        changes.companyId = { from: entry.companyId, to: newComp };
        entry.companyId = newComp;
      }
    }
    if (assignedUserId !== undefined) {
      const newUsr = assignedUserId ? parseInt(assignedUserId, 10) : null;
      if (newUsr !== entry.userId) {
        changes.userId = { from: entry.userId, to: newUsr };
        entry.userId = newUsr;
      }
    }

    entry.updatedById = userId;
    await entry.save();

    // Log timeline changes
    if (Object.keys(changes).length > 0 || comment) {
      await models.RegistryTimeline.create({
        tenantId,
        registryEntryId: entry.id,
        action: comment ? 'comment' : 'update',
        comment: comment || 'Cập nhật thông tin bản ghi.',
        changes: Object.keys(changes).length > 0 ? changes : null,
        authorId: userId
      });
    }

    res.json({ code: 0, entry });
  } catch (e) {
    console.error('Error in PUT /api/registry/entry/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Delete entry
router.delete('/entry/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const entry = await models.RegistryEntry.findOne({
      where: { id, tenantId }
    });
    if (!entry) {
      return res.status(404).json({ code: -1, message: 'Registry entry not found.' });
    }

    await entry.destroy();
    res.json({ code: 0, message: 'Entry deleted.' });
  } catch (e) {
    console.error('Error in DELETE /api/registry/entry/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Timeline / CRM Comments
// ---------------------------------------------------------------------------

// Add comment or activity note
router.post('/entry/:id/timeline', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const id = parseInt(req.params.id, 10);
    const { action, comment, changes } = req.body;

    const entry = await models.RegistryEntry.findOne({
      where: { id, tenantId }
    });
    if (!entry) {
      return res.status(404).json({ code: -1, message: 'Registry entry not found.' });
    }

    if (!comment && !changes) {
      return res.status(400).json({ code: -1, message: 'Comment or changes required.' });
    }

    const timeline = await models.RegistryTimeline.create({
      tenantId,
      registryEntryId: id,
      action: action || 'comment',
      comment: comment || '',
      changes: changes || null,
      authorId: userId
    });

    const fullTimeline = await models.RegistryTimeline.findByPk(timeline.id, {
      include: [{ model: models.User, as: 'author', attributes: ['id', 'name', 'legalName'] }]
    });

    res.json({ code: 0, timeline: fullTimeline });
  } catch (e) {
    console.error('Error in POST /api/registry/entry/:id/timeline:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
router.get('/entries/:defId/export', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const defId = parseInt(req.params.defId, 10);

    const definition = await models.RegistryDefinition.findOne({
      where: { id: defId, tenantId }
    });
    if (!definition) {
      return res.status(404).json({ code: -1, message: 'Registry definition not found.' });
    }

    const entries = await models.RegistryEntry.findAll({
      where: { tenantId, registryDefinitionId: defId },
      order: [['createdAt', 'ASC']],
      include: [
        { model: models.Company, as: 'company', attributes: ['name'] },
        { model: models.User, as: 'user', attributes: ['legalName', 'name'] }
      ]
    });

    const fields = (definition.schema && definition.schema.fields) ? definition.schema.fields : [];
    const headerCols = ['Mã', 'Tiêu đề', 'Trạng thái', 'Khách hàng/Đối tác', 'Người phụ trách', ...fields.map(f => f.label || f.key), 'Ngày tạo'];

    const rows = entries.map(e => {
      const dataCols = fields.map(f => {
        const val = e.data ? e.data[f.key] : '';
        return val !== undefined && val !== null ? String(val) : '';
      });
      return [
        e.code || '',
        e.title || '',
        e.status || '',
        e.company ? e.company.name : '',
        e.user ? (e.user.legalName || e.user.name) : '',
        ...dataCols,
        e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : ''
      ];
    });

    const csvContent = [
      headerCols.map(c => `"${c.replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="registry-${definition.code}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (e) {
    console.error('Error in GET /api/registry/entries/:defId/export:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

export default router;
