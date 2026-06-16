/**
 * Test helper — createTestTenant
 *
 * Two-mode tenant factory for integration/E2E tests.
 *
 * Mode 1 — "shell" (default):
 *   Creates Tenant, TenantMember (owner), 8 CompanyClasses, 1 Company.
 *   This is the state after signup/bootstrap but BEFORE setup wizard.
 *   No FiscalYear, no Accounts, no Menus.
 *
 * Mode 2 — "complete":
 *   All of shell + FiscalYear, AccountClass, Account, AccountRemaining,
 *   SubAccount, SubAccountRemaining, Menus.
 *   This is the state after POST /api/setup.
 *
 * Both modes return { tenant, user, companyClasses, company, membership }
 * plus any phase-2 artifacts.  The caller is responsible for cleanup.
 *
 * Usage:
 *   import { createTestTenant } from '../helpers/createTestTenant.mjs';
 *
 *   const ctx = await createTestTenant({ mode: 'shell' });
 *   // or
 *   const ctx = await createTestTenant({ mode: 'complete', term: 1 });
 */

import models from '../../models/index.js';

let SEQ = 0;

/**
 * Generate a unique slug.
 */
function makeSlug(tag) {
  const stamp = Date.now().toString(36);
  SEQ += 1;
  return `${tag}-${stamp}${(SEQ % 1000).toString(36)}`.slice(0, 40);
}

/**
 * Default CompanyClasses (same as libs/bootstrap.js).
 */
const DEFAULT_COMPANY_CLASSES = [
  { name: '国内購買先', displayOrder: 1, isClient: false },
  { name: '海外購買先', displayOrder: 2, isClient: false },
  { name: '国内外注', displayOrder: 3, isClient: false },
  { name: '海外外注', displayOrder: 4, isClient: false },
  { name: '国内顧客', displayOrder: 5, isClient: true },
  { name: '海外顧客', displayOrder: 6, isClient: true },
  { name: '税金公共料金等', displayOrder: 7, isClient: false },
  { name: '自社', displayOrder: 8, isClient: false },
];

/**
 * Phase 1: Create the tenant shell (signup/bootstrap equivalent).
 */
async function createShell(tag, { user: existingUser } = {}) {
  const stamp = Date.now().toString(36);
  const slug = makeSlug(tag);

  const user = existingUser || await models.User.create({
    name: `th_${tag}_${stamp}`.slice(0, 20),
    hashPassword: 'x-hash',
    legalName: `TH ${tag}`,
    email: `${stamp}-${tag}@example.com`,
  });

  const tenant = await models.Tenant.create({
    slug,
    name: `Test Tenant ${tag} ${stamp}`,
    status: 'active',
  });

  const membership = await models.TenantMember.create({
    userId: user.id,
    tenantId: tenant.id,
    isOwner: true,
    status: 'active',
    isDefault: true,
    accounting: true,
    fiscalBrowsing: true,
    approvable: true,
    administrable: true,
    companyManagement: true,
    inventoryManagement: true,
    personnelManagement: true,
    tenantSettings: true,
  });

  const companyClasses = await models.CompanyClass.bulkCreate(
    DEFAULT_COMPANY_CLASSES.map((cc) => ({ ...cc, tenantId: tenant.id })),
    { returning: true }
  );

  const ownCompanyClass = companyClasses.find((cc) => cc.name === '自社');
  const company = await models.Company.create({
    tenantId: tenant.id,
    companyClassId: ownCompanyClass.id,
    name: '本社',
  });

  return { tenant, user, membership, companyClasses, company };
}

/**
 * Phase 2: Create the accounting baseline (setup wizard equivalent).
 * Creates FiscalYear, AccountClass, Account, AccountRemaining.
 * Simplified — does not parse full account tree, just enough for tests.
 */
async function createSetupBaseline(tenantId, { term = 1, year = 2026 } = {}) {
  const fy = await models.FiscalYear.create({
    tenantId,
    term,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    year,
  });

  // Minimal AccountClass for testing
  const accountClass = await models.AccountClass.create({
    tenantId,
    major: 'Asset',
    middle: 'Current Asset',
    minor: 'Cash',
    field: 1,
  });

  const assetAcc = await models.Account.create({
    tenantId,
    accountCode: '10200000',
    name: 'Cash',
    accountClassId: accountClass.id,
  });

  const liabAcc = await models.Account.create({
    tenantId,
    accountCode: '20200000',
    name: 'A/P',
    accountClassId: accountClass.id,
  });

  await models.AccountRemaining.bulkCreate([
    { accountId: assetAcc.id, term, debit: 0, credit: 0, balance: 0, tenantId },
    { accountId: liabAcc.id, term, debit: 0, credit: 0, balance: 0, tenantId },
  ]);

  // Minimal menu template
  await models.Menu.create({
    tenantId,
    userId: null,
    title: 'Test Menu',
    displayOrder: 1,
    body: JSON.stringify([]),
  });

  return { fy, accountClass, assetAcc, liabAcc };
}

/**
 * Create a test tenant in the specified mode.
 *
 * @param {object} opts
 * @param {'shell'|'complete'} opts.mode - default 'shell'
 * @param {string} opts.tag - short tag for unique naming (default 't')
 * @param {number} opts.term - fiscal term for complete mode (default 1)
 * @param {number} opts.year - fiscal year for complete mode (default 2026)
 * @param {object} opts.user - existing user to attach (optional)
 * @returns {Promise<object>} context with created entities
 */
export async function createTestTenant({
  mode = 'shell',
  tag = 't',
  term = 1,
  year = 2026,
  user: existingUser,
} = {}) {
  const shell = await createShell(tag, { user: existingUser });

  if (mode === 'complete') {
    const baseline = await createSetupBaseline(shell.tenant.id, { term, year });
    return { ...shell, ...baseline, _mode: 'complete' };
  }

  return { ...shell, _mode: 'shell' };
}

/**
 * Destroy all entities created by createTestTenant.
 * Pass the context object returned by createTestTenant.
 */
export async function destroyTestTenant(ctx) {
  if (!ctx) return;

  // Phase 2 artifacts (order matters for FK)
  if (ctx.fy) await ctx.fy.destroy().catch(() => {});
  if (ctx.accountClass) await ctx.accountClass.destroy().catch(() => {});
  if (ctx.assetAcc) await ctx.assetAcc.destroy().catch(() => {});
  if (ctx.liabAcc) await ctx.liabAcc.destroy().catch(() => {});

  // Phase 1 artifacts (order matters for FK)
  if (ctx.company) await ctx.company.destroy().catch(() => {});
  if (ctx.companyClasses) {
    for (const cc of ctx.companyClasses) {
      await cc.destroy().catch(() => {});
    }
  }
  if (ctx.membership) await ctx.membership.destroy().catch(() => {});
  if (ctx.tenant) await ctx.tenant.destroy().catch(() => {});
  // Only destroy user if we created it (not if caller provided it)
  if (ctx.user && !ctx._userProvided) {
    await ctx.user.destroy().catch(() => {});
  }
}

export default { createTestTenant, destroyTestTenant };
