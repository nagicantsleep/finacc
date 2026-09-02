import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

function withThroughAlias(account) {
  const rec = asJson(account);
  const through = rec.LabelAccounts || rec.LabelAccount || rec.labelAccount;
  if (through && !rec.LabelAccounts) rec.LabelAccounts = through;
  return rec;
}

function serializeLabel(label) {
  const rec = asJson(label);
  if (Array.isArray(rec.accounts)) rec.accounts = rec.accounts.map(withThroughAlias);
  return rec;
}

export async function listLabels(tenantId) {
  const labels = await models.Label.findAll({
    where: { tenantId },
    include: [{
      model: models.Account,
      as: 'accounts',
      through: {
        where: { tenantId },
        attributes: ['summaryType']
      }
    }, {
      model: models.Project,
      as: 'projects',
      through: {
        where: { tenantId },
        attributes: []
      }
    }],
    order: [['name', 'ASC']]
  });
  return labels.map(serializeLabel);
}

export async function createLabel(tenantId, body) {
  const newLabel = await models.Label.create({
    name: body.name,
    description: body.description,
    tenantId
  });
  return asJson(newLabel);
}

export async function updateLabel(tenantId, id, body) {
  const label = await models.Label.findOne({ where: { id, tenantId } });
  if (!label) return { ok: false, status: 404, payload: { error: 'Label not found' } };
  await label.update({ name: body.name, description: body.description });
  return { ok: true, payload: asJson(label) };
}

export async function deleteLabel(tenantId, id) {
  const label = await models.Label.findOne({ where: { id, tenantId } });
  if (!label) return { ok: false, status: 404, payload: { error: 'Label not found' } };
  await label.destroy();
  return { ok: true, status: 204, payload: null };
}

export async function getLabelAccounts(tenantId, id) {
  const label = await models.Label.findOne({ where: { id, tenantId } });
  if (!label) return { ok: false, status: 404, payload: { error: 'Label not found' } };
  const accounts = await label.getAccounts({
    through: { where: { tenantId } }
  });
  return { ok: true, payload: accounts.map(withThroughAlias) };
}

async function resolveAccount(tenantId, acc) {
  if (acc.id) {
    return models.Account.findOne({ where: { id: acc.id, tenantId } });
  }
  const code = acc.code || acc.accountCode;
  if (!code) return null;
  return models.Account.findOne({ where: { accountCode: code, tenantId } });
}

export async function updateLabelAccounts(tenantId, id, accounts) {
  const label = await models.Label.findOne({ where: { id, tenantId } });
  if (!label) return { ok: false, status: 404, payload: { error: 'Label not found' } };
  await models.LabelAccount.destroy({ where: { labelId: label.id, tenantId } });
  const list = Array.isArray(accounts) ? accounts : [];
  const newAssociations = [];
  for (const acc of list) {
    const account = await resolveAccount(tenantId, acc);
    if (!account) continue;
    newAssociations.push({
      labelId: label.id,
      accountId: account.id,
      tenantId,
      summaryType: acc.summaryType || 'credit'
    });
  }
  if (newAssociations.length) await models.LabelAccount.bulkCreate(newAssociations);
  return { ok: true, payload: null };
}
