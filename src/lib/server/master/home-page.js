import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { listCompanies } from '$lib/server/accounting/company-list.js';
import { loadMaintenanceMasterData } from '$lib/server/master/tenant-page.js';
import { listNotApproved } from '$lib/server/accounting/crossSlip.js';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';
import { listBackupDates } from '$lib/server/admin-backup.js';

async function listFiscalYears(tenantId) {
  const rows = await models.FiscalYear.findAll({
    where: { tenantId },
    order: [['term', 'ASC']]
  });
  return rows.map((row) => asJson(row));
}

export function parseHomeView(rest) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 1 && /^\d+$/.test(parts[0])) {
    return { action: 'setTerm', term: parseInt(parts[0], 10) };
  }
  if (parts.length > 0) {
    return { action: null };
  }
  return { action: 'index' };
}

export async function loadHomePageData({ tenantId, user, term }) {
  const [ownCompanies, fiscalYears] = await Promise.all([
    listCompanies(tenantId, { kind: 1 }),
    listFiscalYears(tenantId)
  ]);
  const company = ownCompanies.length > 0 ? ownCompanies[0] : null;

  const pageData = {
    company,
    fiscalYears,
    pendingSlips: [],
    accounts: [],
    backupDates: [],
    maintenance: null
  };

  if (user?.approvable && term) {
    const [slips, accounts] = await Promise.all([
      listNotApproved(tenantId, user, term),
      listChartAccounts(tenantId)
    ]);
    pageData.pendingSlips = slips.map((slip) => asJson(slip));
    pageData.accounts = accounts;
  }

  if (user?.administrable) {
    try {
      pageData.backupDates = await listBackupDates();
    } catch {
      pageData.backupDates = [];
    }
    const maintenance = await loadMaintenanceMasterData(tenantId);
    pageData.maintenance = {
      ...maintenance,
      voucherClassSource: maintenance.voucherClasses.map((value) => [value.id, value.name])
    };
  }

  return pageData;
}
