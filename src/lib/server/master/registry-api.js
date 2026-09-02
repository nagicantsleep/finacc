import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

const Op = models.Sequelize.Op;

function fail(e, status = 500) {
  console.error(e);
  return json({ code: -1, message: e.message }, { status });
}

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

export async function handleRegistry(method, { locals, url, body }) {
  const tenantId = locals.tenantId;
  const userId = locals.user?.id;
  const parts = url.pathname.replace(/^\/api\/registry\/?/, '').split('/').filter(Boolean);
  const q = Object.fromEntries(url.searchParams);

  try {
    if (method === 'GET' && parts[0] === 'definitions' && !parts[1]) {
      const definitions = await models.RegistryDefinition.findAll({
        where: { tenantId, status: 'active' },
        order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
        include: [{ model: models.RegistryEntry, as: 'entries', attributes: ['id'] }]
      });
      const results = definitions.map((d) => {
        const plain = d.toJSON();
        plain.entryCount = plain.entries ? plain.entries.length : 0;
        delete plain.entries;
        return plain;
      });
      return json({ code: 0, definitions: results });
    }

    if (method === 'POST' && parts[0] === 'definitions' && !parts[1]) {
      const { name, code, description, icon, schema, layout, displayOrder } = body;
      if (!name || !code) {
        return json({ code: -1, message: 'Name and Code are required.' }, { status: 400 });
      }
      const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const existing = await models.RegistryDefinition.findOne({ where: { tenantId, code: cleanCode } });
      if (existing) {
        return json({ code: -1, message: `Registry code '${cleanCode}' already exists.` }, { status: 409 });
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
      return json({ code: 0, definition });
    }

    if (parts[0] === 'definitions' && parts[1]) {
      const id = parseInt(parts[1], 10);
      const definition = await models.RegistryDefinition.findOne({ where: { id, tenantId } });
      if (!definition) {
        return json({ code: -1, message: 'Registry definition not found.' }, { status: 404 });
      }
      if (method === 'GET') return json({ code: 0, definition });
      if (method === 'PUT') {
        const { name, description, icon, status, schema, layout, displayOrder } = body;
        if (name) definition.name = name;
        if (description !== undefined) definition.description = description;
        if (icon) definition.icon = icon;
        if (status) definition.status = status;
        if (schema) definition.schema = schema;
        if (layout) definition.layout = layout;
        if (displayOrder !== undefined) definition.displayOrder = displayOrder;
        await definition.save();
        return json({ code: 0, definition });
      }
      if (method === 'DELETE') {
        const entryCount = await models.RegistryEntry.count({
          where: { tenantId, registryDefinitionId: id }
        });
        if (entryCount > 0) {
          definition.status = 'archived';
          await definition.save();
          return json({ code: 0, message: 'Registry archived.', archived: true });
        }
        await definition.destroy();
        return json({ code: 0, message: 'Registry deleted.', deleted: true });
      }
    }

    if (parts[0] === 'entries' && parts[1] && parts[2] === 'export' && method === 'GET') {
      const defId = parseInt(parts[1], 10);
      const definition = await models.RegistryDefinition.findOne({ where: { id: defId, tenantId } });
      if (!definition) {
        return json({ code: -1, message: 'Registry definition not found.' }, { status: 404 });
      }
      const entries = await models.RegistryEntry.findAll({
        where: { tenantId, registryDefinitionId: defId },
        order: [['createdAt', 'ASC']],
        include: [
          { model: models.Company, as: 'company', attributes: ['name'] },
          { model: models.User, as: 'user', attributes: ['legalName', 'name'] }
        ]
      });
      const fields = definition.schema?.fields || [];
      const headerCols = ['Mã', 'Tiêu đề', 'Trạng thái', 'Khách hàng/Đối tác', 'Người phụ trách', ...fields.map((f) => f.label || f.key), 'Ngày tạo'];
      const rows = entries.map((e) => {
        const dataCols = fields.map((f) => {
          const val = e.data ? e.data[f.key] : '';
          return val !== undefined && val !== null ? String(val) : '';
        });
        return [
          e.code || '',
          e.title || '',
          e.status || '',
          e.company ? e.company.name : '',
          e.user ? e.user.legalName || e.user.name : '',
          ...dataCols,
          e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : ''
        ];
      });
      const csvContent = [
        headerCols.map((c) => `"${c.replace(/"/g, '""')}"`).join(','),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');
      return new Response('\uFEFF' + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="registry-${definition.code}-${Date.now()}.csv"`
        }
      });
    }

    if (parts[0] === 'entries' && parts[1] && !parts[2]) {
      const defId = parseInt(parts[1], 10);
      const definition = await models.RegistryDefinition.findOne({ where: { id: defId, tenantId } });
      if (!definition) {
        return json({ code: -1, message: 'Registry definition not found.' }, { status: 404 });
      }
      if (method === 'GET') {
        const { q: searchQ, status, companyId, limit, offset } = q;
        const where = { tenantId, registryDefinitionId: defId };
        if (status && status !== 'all') where.status = status;
        if (companyId) where.companyId = parseInt(companyId, 10);
        if (searchQ && searchQ.trim()) {
          const search = `%${searchQ.trim()}%`;
          where[Op.or] = [{ title: { [Op.iLike]: search } }, { code: { [Op.iLike]: search } }];
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
        return json({ code: 0, definition, total: entries.count, entries: entries.rows });
      }
      if (method === 'POST') {
        const { title, data, companyId, assignedUserId, status, code } = body;
        if (!title || !title.trim()) {
          return json({ code: -1, message: 'Title is required.' }, { status: 400 });
        }
        const payloadData = data || {};
        const validationErrors = validateEntryData(definition.schema, payloadData);
        if (validationErrors.length > 0) {
          return json({ code: -1, message: validationErrors.join(' ') }, { status: 400 });
        }
        let entryCode = code;
        if (!entryCode) {
          const count = await models.RegistryEntry.count({ where: { tenantId, registryDefinitionId: defId } });
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
        return json({ code: 0, entry });
      }
    }

    if (parts[0] === 'entry' && parts[1] && parts[2] === 'timeline' && method === 'POST') {
      const id = parseInt(parts[1], 10);
      const { action, comment, changes } = body;
      const entry = await models.RegistryEntry.findOne({ where: { id, tenantId } });
      if (!entry) return json({ code: -1, message: 'Registry entry not found.' }, { status: 404 });
      if (!comment && !changes) {
        return json({ code: -1, message: 'Comment or changes required.' }, { status: 400 });
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
      return json({ code: 0, timeline: fullTimeline });
    }

    if (parts[0] === 'entry' && parts[1] && !parts[2]) {
      const id = parseInt(parts[1], 10);
      if (method === 'GET') {
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
        if (!entry) return json({ code: -1, message: 'Registry entry not found.' }, { status: 404 });
        return json({ code: 0, entry });
      }
      if (method === 'PUT') {
        const { title, data, companyId, assignedUserId, status, comment } = body;
        const entry = await models.RegistryEntry.findOne({
          where: { id, tenantId },
          include: [{ model: models.RegistryDefinition, as: 'definition' }]
        });
        if (!entry) return json({ code: -1, message: 'Registry entry not found.' }, { status: 404 });
        const payloadData = data !== undefined ? data : entry.data;
        if (entry.definition?.schema) {
          const validationErrors = validateEntryData(entry.definition.schema, payloadData);
          if (validationErrors.length > 0) {
            return json({ code: -1, message: validationErrors.join(' ') }, { status: 400 });
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
        return json({ code: 0, entry });
      }
      if (method === 'DELETE') {
        const entry = await models.RegistryEntry.findOne({ where: { id, tenantId } });
        if (!entry) return json({ code: -1, message: 'Registry entry not found.' }, { status: 404 });
        await entry.destroy();
        return json({ code: 0, message: 'Entry deleted.' });
      }
    }

    return json({ code: -1, message: 'Not found' }, { status: 404 });
  } catch (e) {
    return fail(e);
  }
}
