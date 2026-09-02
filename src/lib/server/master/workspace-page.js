import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { getWorkspaceTemplates } from '$lib/server/master/menu-api.js';
import { listNotApproved } from '$lib/server/accounting/crossSlip.js';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';
import { listBackupDates } from '$lib/server/admin-backup.js';
import { loadMaintenanceMasterData } from '$lib/server/master/tenant-page.js';

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

function widgetComponentNames(widgets) {
  return new Set((widgets || []).map((widget) => widget.component).filter(Boolean));
}

function applyWidgetBootstrap(workspace, bootstrap) {
  if (!workspace?.widgets?.length || !bootstrap) return workspace;
  return {
    ...workspace,
    widgets: workspace.widgets.map((widget) => {
      const data = bootstrap[widget.component];
      if (!data) return widget;
      return {
        ...widget,
        options: { ...(widget.options || {}), ...data }
      };
    })
  };
}

async function listFiscalYears(tenantId) {
  const rows = await models.FiscalYear.findAll({
    where: { tenantId },
    order: [['term', 'ASC']]
  });
  return rows.map((row) => asJson(row));
}

export async function loadWorkspaceWidgetBootstrap({ tenantId, user, term, widgets }) {
  const names = widgetComponentNames(widgets);
  const bootstrap = {};

  if (names.has('SelectTerm')) {
    bootstrap.SelectTerm = { fiscalYears: await listFiscalYears(tenantId) };
  }

  if (names.has('Approve') && user?.approvable) {
    const [slips, accounts] = await Promise.all([
      listNotApproved(tenantId, user, term),
      listChartAccounts(tenantId)
    ]);
    bootstrap.Approve = {
      pendingSlips: slips.map((slip) => asJson(slip)),
      accounts
    };
  }

  if (names.has('Backup') && user?.administrable) {
    try {
      bootstrap.Backup = { backupDates: await listBackupDates() };
    } catch {
      bootstrap.Backup = { backupDates: [] };
    }
  }

  const maintenanceWidgets = [
    'CompanyKinds',
    'TransactionKinds',
    'VoucherClasses',
    'ItemClasses',
    'MemberClasses'
  ];
  if (maintenanceWidgets.some((name) => names.has(name))) {
    const maintenance = await loadMaintenanceMasterData(tenantId);
    const voucherClassSource = maintenance.voucherClasses.map((value) => [value.id, value.name]);
    if (names.has('CompanyKinds')) {
      bootstrap.CompanyKinds = { initialValues: maintenance.companyClasses };
    }
    if (names.has('TransactionKinds')) {
      bootstrap.TransactionKinds = {
        initialValues: maintenance.transactionKinds,
        voucherClassSource
      };
    }
    if (names.has('VoucherClasses')) {
      bootstrap.VoucherClasses = { initialValues: maintenance.voucherClasses };
    }
    if (names.has('ItemClasses')) {
      bootstrap.ItemClasses = { initialValues: maintenance.itemClasses };
    }
    if (names.has('MemberClasses')) {
      bootstrap.MemberClasses = { initialValues: maintenance.memberClasses };
    }
  }

  return bootstrap;
}

export async function loadWorkspacePageData({ tenantId, userId, user, term, viewState, workspaceId }) {
  if (viewState === 'new') {
    return { workspace: { title: 'ホーム', widgets: [] } };
  }

  let workspace;
  if (viewState === 'entry') {
    workspace = await getWorkspaceById(tenantId, workspaceId);
  } else {
    workspace = await loadDefaultWorkspace(tenantId, userId);
  }

  if (!workspace) {
    return { workspace: null };
  }

  const bootstrap = await loadWorkspaceWidgetBootstrap({
    tenantId,
    user,
    term,
    widgets: workspace.widgets
  });
  workspace = applyWidgetBootstrap(workspace, bootstrap);
  return { workspace };
}
