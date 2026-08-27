import models from '../../../models/index.js';

export const DEFAULT_COMPANY_CLASSES = [
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
 * Generate a random string of lowercase letters.
 */
function randomChars(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate a unique tenant slug from a username.
 * Strips characters not safe for a slug and appends a short timestamp suffix
 * with 4-6 random characters for entropy so concurrent/duplicate requests are
 * unlikely to collide.
 */
export function slugFromName(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'user';
  const entropy = 4 + Math.floor(Math.random() * 3); // 4-6 chars
  return `${base}-${Date.now().toString(36)}${randomChars(entropy)}`;
}

/**
 * Seed the base shell for a new tenant.
 *
 * Creates Tenant, TenantMember (owner), 8 CompanyClass, and 1 Company ("本社").
 * This is the single source of truth for tenant shell creation.
 *
 * Must be called inside an existing Sequelize transaction (t).
 * The caller is responsible for idempotency checks before calling this function.
 *
 * @param {object} user - The user object (must have id, legalName/name)
 * @param {object} opts
 * @param {string} opts.name - Tenant display name
 * @param {string} opts.slug - Tenant URL slug (must be unique)
 * @param {boolean} opts.isDefault - Whether this is the user's default tenant
 * @param {object} t - Sequelize transaction
 * @returns {Promise<{tenant, membership, companyClasses, company}>}
 */
export async function seedTenantBase(user, { name, slug, isDefault }, t) {
  const tenant = await models.Tenant.create(
    { slug, name, status: 'active' },
    { transaction: t }
  );

  const membership = await models.TenantMember.create(
    {
      userId: user.id,
      tenantId: tenant.id,
      isOwner: true,
      status: 'active',
      isDefault: !!isDefault,
      accounting: true,
      fiscalBrowsing: true,
      approvable: true,
      administrable: true,
      companyManagement: true,
      inventoryManagement: true,
      personnelManagement: true,
      tenantSettings: true
    },
    { transaction: t }
  );

  const companyClasses = await models.CompanyClass.bulkCreate(
    DEFAULT_COMPANY_CLASSES.map((cc) => ({
      ...cc,
      tenantId: tenant.id
    })),
    { transaction: t, returning: true }
  );
  const ownCompanyClass = companyClasses.find((cc) => cc.name === '自社');

  const company = await models.Company.create(
    {
      tenantId: tenant.id,
      companyClassId: ownCompanyClass.id,
      name: '本社'
    },
    { transaction: t }
  );

  return { tenant, membership, companyClasses, company };
}

/**
 * Bootstrap a personal owned default tenant for a newly self-registered user.
 *
 * Must be called inside an existing Sequelize transaction (t).
 * Idempotent: if a default TenantMember already exists for this user, returns it
 * without creating duplicates.
 *
 * Returns { tenant, membership, companyClasses, company }.
 */
export async function bootstrapTenantMember(user, t) {
  // Idempotency guard inside the transaction with a row-level lock to prevent
  // concurrent signups from racing past this check and creating duplicate tenants.
  const existing = await models.TenantMember.findOne({
    where: { userId: user.id, isDefault: true },
    lock: t.LOCK.UPDATE,
    transaction: t
  });
  if (existing) {
    const tenant = await models.Tenant.findByPk(existing.tenantId, { transaction: t });
    return { tenant, membership: existing };
  }

  // Create the personal tenant via the single source of truth.
  const slug = slugFromName(user.name);
  return seedTenantBase(
    user,
    { name: `${user.legalName}さんの組織`, slug, isDefault: true },
    t
  );
}

// Keep old function name as alias for backward compatibility during transition
export const bootstrapUserTenant = bootstrapTenantMember;

export default { bootstrapTenantMember, bootstrapUserTenant, seedTenantBase, slugFromName };
