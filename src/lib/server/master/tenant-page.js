import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { listCompanyClasses } from '$lib/server/accounting/company-list.js';
import { listTransactionKinds } from '$lib/server/master/transaction-page.js';
import { listVoucherClasses } from '$lib/server/master/voucher-page.js';
import { getCompanyInfo } from '$lib/server/utils.js';
import { listBackupDates } from '$lib/server/admin-backup.js';

async function listItemClasses(tenantId) {
  const rows = await models.ItemClass.findAll({
    where: { tenantId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((row) => asJson(row));
}

async function listTaxRules(tenantId) {
  const rows = await models.TaxRule.findAll({
    where: { tenantId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((row) => asJson(row));
}

async function listMemberClasses() {
  const rows = await models.MemberClass.findAll({
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((row) => asJson(row));
}

export async function loadMaintenanceMasterData(tenantId) {
  const [companyClasses, transactionKinds, voucherClasses, itemClasses, taxRules, memberClasses] =
    await Promise.all([
      listCompanyClasses(tenantId),
      listTransactionKinds(tenantId),
      listVoucherClasses(tenantId),
      listItemClasses(tenantId),
      listTaxRules(tenantId),
      listMemberClasses()
    ]);

  return {
    companyClasses,
    transactionKinds,
    voucherClasses,
    itemClasses,
    taxRules,
    memberClasses
  };
}

export async function loadTenantPageData({ tenantId, user }) {
  const { companyClasses, transactionKinds, voucherClasses, itemClasses, taxRules } =
    await loadMaintenanceMasterData(tenantId);
  const company = await getCompanyInfo(tenantId);

  let backupDates = [];
  if (user?.administrable) {
    try {
      backupDates = await listBackupDates();
    } catch {
      backupDates = [];
    }
  }

  return {
    companyClasses,
    transactionKinds,
    voucherClasses,
    itemClasses,
    taxRules,
    company: company || {},
    backupDates
  };
}
