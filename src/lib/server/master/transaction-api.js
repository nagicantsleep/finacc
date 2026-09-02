import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

const transactionInclude = (tenantId) => [
  { model: models.Task, as: 'task', where: { tenantId }, required: false },
  {
    model: models.TransactionDetail,
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
  { model: models.Document, as: 'document', where: { tenantId }, required: false },
  {
    model: models.TransactionKind,
    as: 'kind',
    where: { tenantId },
    required: false,
    include: [{ model: models.VoucherClass, as: 'book', where: { tenantId }, required: false }]
  }
];

function usableLine(line) {
  return typeof line.itemId === 'number' || (line.itemName !== '' && line.itemName != null);
}

export async function listTransactions(tenantId, query) {
  let where = { tenantId };
  let order = [['issueDate', 'DESC'], ['lines', 'lineNo', 'ASC']];
  if (query.order === 'asc') {
    order = [['issueDate', 'ASC'], ['lines', 'lineNo', 'ASC']];
  }
  const include = transactionInclude(tenantId);
  if (query.company) {
    include[0] = {
      model: models.Task,
      as: 'task',
      where: { tenantId, companyId: parseInt(query.company, 10) },
      required: false
    };
  }
  if (query.kind) {
    const kind = parseInt(query.kind, 10);
    if (kind > 0) where = { [Op.and]: [where, { kindId: kind }] };
  }
  if (query.task) {
    where = { [Op.and]: [where, { taskId: parseInt(query.task, 10) }] };
  }
  const transactions = await models.TransactionDocument.findAll({
    where,
    order,
    include
  });
  return { code: 0, transactions: transactions.map(asJson) };
}

export async function getTransaction(tenantId, id) {
  const transaction = await models.TransactionDocument.findOne({
    where: { id, tenantId },
    include: transactionInclude(tenantId)
  });
  if (!transaction) return null;
  return { code: 0, transaction: asJson(transaction) };
}

export async function createTransaction(tenantId, user, term, body) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  const payload = {
    ...body,
    id: undefined,
    createdBy: user.id,
    updatedBy: user.id,
    tenantId
  };
  if (!payload.no) {
    const fyWhere = { tenantId };
    if (term != null && term !== '') fyWhere.term = term;
    const fy = await models.FiscalYear.findOne({
      where: fyWhere,
      order: [['term', 'DESC']]
    });
    if (fy) {
      fy.transactionCount = (fy.transactionCount || 0) + 1;
      await fy.save();
      payload.no = `${fy.year}-${fy.transactionCount}`;
    }
  }
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
  const transaction = await models.TransactionDocument.create(payload);
  for (let i = 0; i < (payload.lines || []).length; i += 1) {
    const line = payload.lines[i];
    if (usableLine(line)) {
      await models.TransactionDetail.create({
        ...line,
        transactionDocumentId: transaction.id,
        lineNo: i,
        id: undefined,
        tenantId
      });
    }
  }
  return { ok: true, payload: { id: transaction.id, documentId: transaction.documentId } };
}

export async function updateTransaction(tenantId, user, body, id) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  const txId = id || body.id;
  const transaction = await models.TransactionDocument.findOne({
    where: { id: txId, tenantId },
    include: [
      { model: models.Document, as: 'document' },
      { model: models.TransactionKind, as: 'kind' }
    ]
  });
  if (!transaction) return { ok: false, status: 404, payload: { code: -1 } };
  let documentId = transaction.documentId;
  const patch = { ...body };
  delete patch.id;
  delete patch.tenantId;
  transaction.set({ ...patch, updatedBy: user.id, tenantId });
  if (transaction.kind?.hasDetails) {
    await models.TransactionDetail.destroy({
      where: { transactionDocumentId: transaction.id, tenantId }
    });
  }
  const lines = [];
  for (let i = 0; i < (body.lines || []).length; i += 1) {
    const line = body.lines[i];
    if (usableLine(line)) {
      const created = await models.TransactionDetail.create({
        ...line,
        transactionDocumentId: transaction.id,
        lineNo: i,
        id: undefined,
        tenantId
      });
      lines.push(asJson(created));
    }
  }
  if (body.document?.descriptionType) {
    if (documentId && transaction.document) {
      transaction.document.issueDate = body.issueDate;
      transaction.document.title = body.subject;
      transaction.document.descriptionType = body.document.descriptionType;
      transaction.document.description = body.document.description;
      transaction.document.handledBy = body.handledBy;
      transaction.document.updatedBy = user.id;
      await transaction.document.save();
    } else {
      const document = await models.Document.create({
        issueDate: body.issueDate,
        title: body.subject,
        descriptionType: body.document.descriptionType,
        description: body.document.description,
        handledBy: body.handledBy,
        createdBy: user.id,
        updatedBy: user.id,
        tenantId
      });
      transaction.documentId = document.id;
    }
  }
  await transaction.save();
  return { ok: true, payload: { id: transaction.id, documentId: transaction.documentId } };
}

export async function deleteTransaction(tenantId, user, id) {
  if (!user.companyManagement) return { ok: false, payload: { code: -2 } };
  const transaction = await models.TransactionDocument.findOne({ where: { id, tenantId } });
  if (!transaction) return { ok: false, status: 404, payload: { code: -1 } };
  await transaction.destroy();
  return { ok: true, payload: { code: 0 } };
}
