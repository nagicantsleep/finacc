import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

const taskInclude = (tenantId) => [
  { model: models.Company, as: 'company', where: { tenantId }, required: false },
  {
    model: models.TaskDetail,
    as: 'lines',
    where: { tenantId },
    required: false,
    include: [{ model: models.TaxRule, as: 'taxRule', where: { tenantId }, required: false }]
  },
  {
    model: models.User,
    as: 'handleUser',
    attributes: ['name', 'legalName'],
    include: [
      {
        model: models.TenantMember,
        as: 'memberships',
        where: { tenantId },
        required: false,
        attributes: ['tradingName']
      }
    ]
  },
  { model: models.Document, as: 'document', where: { tenantId }, required: false }
];

export async function listTasks(tenantId, query) {
  let where = { tenantId };
  const order = [['issueDate', 'DESC'], ['companyId', 'ASC']];
  if (query.company) {
    where = { [Op.and]: [where, { companyId: parseInt(query.company, 10) }] };
  }
  const tasks = await models.Task.findAll({
    where,
    order,
    include: taskInclude(tenantId)
  });
  return { code: 0, tasks: tasks.map(asJson) };
}

export async function getTask(tenantId, id) {
  const task = await models.Task.findOne({
    where: { id, tenantId },
    include: taskInclude(tenantId),
    order: [['lines', 'lineNo', 'ASC']]
  });
  if (!task) return null;
  return { code: 0, task: asJson(task) };
}

function usableLine(line) {
  return typeof line.itemId === 'number' || (line.itemName !== '' && line.itemName != null);
}

export async function createTask(tenantId, user, body) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  const payload = {
    ...body,
    id: undefined,
    createdBy: user.id,
    updatedBy: user.id,
    tenantId
  };
  const document = await models.Document.create({
    issueDate: payload.issueDate,
    title: payload.subject,
    descriptionType: payload.document?.descriptionType,
    description: payload.document?.description,
    handledBy: payload.handledBy,
    createdBy: payload.createdBy,
    updatedBy: payload.updatedBy,
    tenantId
  });
  payload.documentId = document.id;
  const task = await models.Task.create(payload);
  const lines = [];
  for (let i = 0; i < (payload.lines || []).length; i += 1) {
    const line = payload.lines[i];
    if (usableLine(line)) {
      const created = await models.TaskDetail.create({
        ...line,
        taskId: task.id,
        lineNo: i,
        id: undefined,
        tenantId
      });
      lines.push(asJson(created));
    }
  }
  const out = asJson(task);
  out.document = asJson(document);
  out.lines = lines;
  return { ok: true, payload: { task: out } };
}

export async function updateTask(tenantId, user, body, id) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  const taskId = id || body.id;
  const task = await models.Task.findOne({
    where: { id: taskId, tenantId },
    include: [{ model: models.Document, as: 'document' }]
  });
  if (!task) return { ok: false, status: 404, payload: { code: -1 } };
  task.set({ ...body, updatedBy: user.id, tenantId });
  await task.save();
  await models.TaskDetail.destroy({ where: { taskId: task.id, tenantId } });
  const lines = [];
  for (let i = 0; i < (body.lines || []).length; i += 1) {
    const line = body.lines[i];
    if (usableLine(line)) {
      const created = await models.TaskDetail.create({
        ...line,
        taskId: task.id,
        lineNo: i,
        id: undefined,
        tenantId
      });
      lines.push(asJson(created));
    }
  }
  if (task.document && body.document) {
    task.document.issueDate = body.issueDate;
    task.document.title = body.subject;
    task.document.descriptionType = body.document.descriptionType;
    task.document.description = body.document.description;
    task.document.handledBy = body.handledBy;
    task.document.updatedBy = user.id;
    await task.document.save();
  }
  const out = asJson(task);
  out.lines = lines;
  return { ok: true, payload: { task: out } };
}

export async function deleteTask(tenantId, user, id) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  await models.Task.destroy({ where: { id, tenantId } });
  return { ok: true, payload: { code: 0 } };
}
