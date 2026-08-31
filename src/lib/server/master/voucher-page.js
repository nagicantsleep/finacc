import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import { fiscalMonthRange } from '$lib/server/accounting/journal-read.js';
import { listChartAccounts } from '$lib/server/accounting/chart-accounts.js';
import { getVoucher, listVouchers } from '$lib/server/master/voucher-api.js';

const VIEW_STATES = new Set(['list', 'entry', 'new']);

export function parseVoucherView(rest) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  const viewState = parts[0] || 'list';
  const entryId = viewState === 'entry' ? parseInt(parts[1], 10) : NaN;

  return {
    viewState: VIEW_STATES.has(viewState) ? viewState : null,
    entryId: Number.isFinite(entryId) ? entryId : null
  };
}

export function voucherFiltersFromSearchParams(searchParams) {
  const filters = {};
  for (const key of ['month', 'type', 'company', 'upper', 'lower', 'date']) {
    const value = searchParams.get(key);
    if (value != null && value !== '') {
      filters[key] = value;
    }
  }
  return filters;
}

export function voucherQueryFromFilters(filters) {
  const query = {};
  for (const key of ['month', 'type', 'company', 'upper', 'lower', 'date']) {
    if (filters[key] != null && filters[key] !== '') {
      query[key] = filters[key];
    }
  }
  return query;
}

export async function listVoucherClasses(tenantId) {
  const rows = await models.VoucherClass.findAll({
    where: { tenantId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((row) => asJson(row));
}

export function buildVoucherMonthTabs(currentFy) {
  const dates = fiscalMonthRange(currentFy?.startDate, currentFy?.endDate);
  if (dates.length === 0) {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      year,
      month: i + 1,
      ym: `${year}-${i + 1}`
    }));
  }
  return dates.map((date) => ({
    year: date.year,
    month: date.month,
    ym: `${date.year}-${date.month}`
  }));
}

export function newVoucherTemplate() {
  const now = new Date();
  const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    issueDate,
    paymentDate: null,
    amount: 0,
    taxClass: -1,
    tax: 0,
    type: -1
  };
}

export async function loadVoucherPageData({
  tenantId,
  term,
  viewState,
  entryId,
  filters,
  currentFy
}) {
  const [voucherClasses, accounts, dates] = await Promise.all([
    listVoucherClasses(tenantId),
    listChartAccounts(tenantId),
    Promise.resolve(buildVoucherMonthTabs(currentFy))
  ]);

  if (viewState === 'list') {
    const { vouchers } = await listVouchers(
      tenantId,
      voucherQueryFromFilters(filters),
      term
    );
    return { vouchers, selectedVoucher: null, voucherClasses, accounts, dates };
  }

  if (viewState === 'new') {
    return {
      vouchers: [],
      selectedVoucher: newVoucherTemplate(),
      voucherClasses,
      accounts,
      dates
    };
  }

  const selected = await getVoucher(tenantId, entryId);
  return {
    vouchers: [],
    selectedVoucher: selected?.voucher || null,
    voucherClasses,
    accounts,
    dates
  };
}
