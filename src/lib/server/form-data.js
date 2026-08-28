import models from '$lib/server/db/index.js';
import initializeExplanatoryJournal from '$lib/server/init-explanatory-journal.js';
import initializeGeneralLedger from '$lib/server/init-general-ledger.js';
import initializeSubsidiaryLedger from '$lib/server/init-subsidiary-ledger.js';
import initializeFinancialStatement from '$lib/server/init-financial-statement.js';
import initializeTrialBalance from '$lib/server/init-trial-balance.js';

export function resolveTerm(url, locals) {
  const q = parseInt(url.searchParams.get('term') || '', 10);
  if (Number.isFinite(q) && q > 0) return q;
  const t = parseInt(locals.term || locals.currentFy?.term || '', 10);
  if (Number.isFinite(t) && t > 0) return t;
  return 1;
}

export function serializeForm(data) {
  return JSON.parse(JSON.stringify(data, (_k, v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  }));
}

export async function formCompany(tenantId) {
  const tenant = await models.Tenant.findByPk(tenantId);
  const company = await models.Company.findOne({ where: { tenantId } });
  if (company) {
    return {
      name: company.officialName || company.name,
      zip: company.zip,
      address1: company.address1,
      address2: company.address2,
      tel: company.tel,
      bankName: company.bankName,
      bankBranchName: company.bankBranchName,
      accountNo: company.accountNo,
      accountType: company.accountType
    };
  }
  return {
    name: tenant?.name || 'Hieronymus Corp',
    zip: '100-0001',
    address1: '東京都千代田区千代田1-1',
    address2: '',
    tel: ''
  };
}

function fyShape(fy) {
  if (!fy) return { term: 1, year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' };
  const row = typeof fy.toJSON === 'function' ? fy.toJSON() : fy;
  return {
    term: row.term,
    year: row.year,
    startDate: row.startDate,
    endDate: row.endDate
  };
}

export async function loadJournalForm(term, tenantId) {
  const company = await formCompany(tenantId);
  const { fy, dates } = await initializeExplanatoryJournal(term, tenantId);
  return serializeForm({ company, fy: fyShape(fy), dates: dates || [] });
}

export async function loadGeneralLedgerForm(term, tenantId) {
  const company = await formCompany(tenantId);
  const { fy, accountPages, ledgerPages } = await initializeGeneralLedger(term, tenantId);
  return serializeForm({
    company,
    fy: fyShape(fy),
    accountPages: accountPages || [],
    ledgerPages: ledgerPages || []
  });
}

export async function loadSubsidiaryLedgerForm(term, tenantId) {
  const company = await formCompany(tenantId);
  const { fy, ledgerPages } = await initializeSubsidiaryLedger(term, tenantId);
  return serializeForm({ company, fy: fyShape(fy), ledgerPages: ledgerPages || [] });
}

export async function loadFinancialStatementForm(term, tenantId) {
  const company = await formCompany(tenantId);
  const data = await initializeFinancialStatement(term, tenantId);
  return serializeForm({
    company,
    fy: fyShape(data.fy),
    bsLines: data.bsLines || [],
    plOut: data.plOut || [],
    sgaPage: data.sgaPage || [],
    sgaSum: data.sgaSum || 0,
    asset: data.asset || 0,
    liabilities: data.liabilities || 0,
    networth: data.networth || 0
  });
}

export async function loadTrialBalanceForm(term, tenantId) {
  const company = await formCompany(tenantId);
  try {
    const data = await initializeTrialBalance(term, tenantId);
    return serializeForm({
      company,
      fy: fyShape(data.fy),
      assetPages: data.assetPages || [],
      liabilitiesAndCapitalPages: data.liabilitiesAndCapitalPages || [],
      incomeStatementPages: data.incomeStatementPages || []
    });
  } catch (e) {
    console.error('loadTrialBalanceForm', e);
    return serializeForm({
      company,
      fy: fyShape(null),
      assetPages: [],
      liabilitiesAndCapitalPages: [],
      incomeStatementPages: []
    });
  }
}
