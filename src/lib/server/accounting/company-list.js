import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

const VIEW_STATES = new Set(['list', 'home', 'entry', 'new']);

export function mapCompany(row) {
  const json = asJson(row);
  if (!json) return null;
  return {
    ...json,
    companyClass: asJson(row.companyClass) || json.companyClass || null
  };
}

export function parseCompanyView(rest, searchParams) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  const viewState = parts[0] || 'list';
  const entryId = viewState === 'entry' ? parseInt(parts[1], 10) : NaN;
  const kind = parseInt(searchParams?.get?.('kind') || '-1', 10);

  return {
    viewState: VIEW_STATES.has(viewState) ? viewState : null,
    entryId: Number.isFinite(entryId) ? entryId : null,
    kind: Number.isFinite(kind) ? kind : -1
  };
}

export async function listCompanyClasses(tenantId) {
  const rows = await models.CompanyClass.findAll({
    where: { tenantId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((r) => asJson(r));
}

export async function listCompanies(tenantId, { kind } = {}) {
  const where = { tenantId };
  if (Number.isFinite(kind) && kind > 0) {
    where.companyClassId = kind;
  }

  const rows = await models.Company.findAll({
    where,
    include: [{ model: models.CompanyClass, as: 'companyClass' }],
    order: [['id', 'ASC']]
  });
  return rows.map(mapCompany);
}

export async function getCompanyById(tenantId, id) {
  if (!Number.isFinite(id)) return null;

  const row = await models.Company.findOne({
    where: { id, tenantId },
    include: [{ model: models.CompanyClass, as: 'companyClass' }]
  });
  return mapCompany(row);
}
