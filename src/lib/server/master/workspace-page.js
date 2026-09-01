import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { getWorkspaceTemplates } from '$lib/server/master/menu-api.js';

const Op = models.Sequelize.Op;

export function deserializeWorkspaceRow(row) {
  if (!row) {
    return { title: 'ホーム', widgets: [] };
  }
  const ws = asJson(row);
  let parsedWidgets = [];
  try {
    if (typeof ws.body === 'string') {
      parsedWidgets = JSON.parse(ws.body);
    } else if (Array.isArray(ws.menu)) {
      parsedWidgets = ws.menu;
    } else if (Array.isArray(ws.widgets)) {
      parsedWidgets = ws.widgets;
    }
  } catch {
    parsedWidgets = [];
  }
  return {
    id: ws.id,
    title: ws.title || 'ホーム',
    displayOrder: ws.displayOrder,
    widgets: parsedWidgets
  };
}

export async function listUserWorkspaces(tenantId, userId) {
  const rows = await models.Menu.findAll({
    where: {
      tenantId,
      userId,
      displayOrder: { [Op.gt]: 0 }
    },
    order: [['displayOrder', 'ASC']],
    include: [{ model: models.User, as: 'user' }]
  });
  return rows.map(deserializeWorkspaceRow);
}

export async function getWorkspaceById(tenantId, id) {
  if (!Number.isFinite(id)) return null;
  const row = await models.Menu.findOne({
    where: { tenantId, id }
  });
  return row ? deserializeWorkspaceRow(row) : null;
}

export async function loadDefaultWorkspace(tenantId, userId) {
  const list = await listUserWorkspaces(tenantId, userId);
  if (list.length > 0) {
    return list[0];
  }
  const { templates } = await getWorkspaceTemplates(tenantId);
  const homeTpl =
    templates.find((t) => t.title === 'ホーム') || templates[1] || templates[0];
  if (homeTpl) {
    return deserializeWorkspaceRow(homeTpl);
  }
  return { title: 'ホーム', widgets: [] };
}

const VIEW_STATES = new Set(['default', 'entry', 'new']);

export function parseWorkspaceView(rest) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { viewState: 'default', workspaceId: null };
  }
  if (parts[0] === 'new') {
    return { viewState: 'new', workspaceId: null };
  }
  const workspaceId = parseInt(parts[0], 10);
  if (!Number.isFinite(workspaceId)) {
    return { viewState: null, workspaceId: null };
  }
  return { viewState: 'entry', workspaceId };
}

export async function loadWorkspacePageData({ tenantId, userId, viewState, workspaceId }) {
  if (viewState === 'new') {
    return { workspace: { title: 'ホーム', widgets: [] } };
  }
  if (viewState === 'entry') {
    const workspace = await getWorkspaceById(tenantId, workspaceId);
    return { workspace };
  }
  const workspace = await loadDefaultWorkspace(tenantId, userId);
  return { workspace };
}
