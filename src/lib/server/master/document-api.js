import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import Mime from 'mime';

export async function listDocuments(tenantId) {
  const documents = await models.Document.findAll({
    where: { tenantId },
    include: [{
      model: models.DocumentFile,
      as: 'files',
      where: { tenantId },
      required: false,
      attributes: ['id', 'mimeType']
    }],
    order: [['issueDate', 'DESC']]
  });
  return documents.map(asJson);
}

export async function getDocument(tenantId, id) {
  const document = await models.Document.findOne({ where: { id, tenantId } });
  return asJson(document);
}

export async function createDocument(tenantId, body) {
  const patch = { ...body, tenantId };
  delete patch.id;
  const document = await models.Document.create(patch);
  return asJson(document);
}

export async function updateDocument(tenantId, id, body) {
  const document = await models.Document.findOne({ where: { id, tenantId } });
  if (!document) return { ok: false, status: 404, payload: { code: -1 } };
  const patch = { ...body, tenantId };
  document.set(patch);
  await document.save();
  return { ok: true, payload: asJson(document) };
}

export async function deleteDocument(tenantId, id) {
  const document = await models.Document.findOne({ where: { id, tenantId } });
  if (!document) return { ok: false, status: 404, payload: { code: -1 } };
  await document.destroy();
  return { ok: true, payload: { code: 0 } };
}

export async function getDocumentFiles(documentId, tenantId) {
  const files = await models.DocumentFile.findAll({
    where: { documentId, tenantId },
    attributes: { exclude: ['body'] }
  });
  const out = [];
  for (const file of files) {
    const rec = asJson(file);
    if (file.mimeType && String(file.mimeType).startsWith('image/')) {
      const full = await models.DocumentFile.findOne({ where: { id: file.id, tenantId } });
      rec.body = full?.body ? Buffer.from(full.body).toString('base64') : '';
    } else {
      rec.body = '';
    }
    out.push(rec);
  }
  return out;
}

export async function getDocumentFileBody(tenantId, fileId) {
  const content = await models.DocumentFile.findOne({ where: { id: fileId, tenantId } });
  if (!content) return null;
  return {
    mimeType: content.mimeType || 'application/octet-stream',
    body: content.body ? Buffer.from(content.body) : Buffer.alloc(0),
    name: content.name
  };
}

export async function uploadDocumentFile(tenantId, documentId, file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { ok: false, payload: { code: -1 } };
  }
  if (documentId) {
    const document = await models.Document.findOne({ where: { id: documentId, tenantId } });
    if (!document) return { ok: false, status: 404, payload: { code: -1 } };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || Mime.getType(file.name) || 'application/octet-stream';
  const row = await models.DocumentFile.create({
    name: file.name,
    documentId: documentId || null,
    tenantId,
    mimeType,
    body: buf
  });
  const rec = asJson(row);
  rec.body = buf.toString('base64');
  return { ok: true, payload: { code: 0, file: rec } };
}

export async function bindDocumentFile(tenantId, fileId, documentId) {
  const file = await models.DocumentFile.findOne({ where: { id: fileId, tenantId } });
  if (!file) return { ok: false, status: 404, payload: { code: -1 } };
  const document = await models.Document.findOne({ where: { id: documentId, tenantId } });
  if (!document) return { ok: false, status: 403, payload: { code: -3 } };
  file.documentId = documentId;
  await file.save();
  return { ok: true, payload: { code: 0 } };
}

export async function deleteDocumentFile(tenantId, fileId) {
  const file = await models.DocumentFile.findOne({ where: { id: fileId, tenantId } });
  if (!file) return { ok: false, payload: { code: -1 } };
  await file.destroy();
  return { ok: true, payload: { code: 0 } };
}
