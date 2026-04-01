import models from '../models/index.js';

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
 * Generate a unique tenant slug from a username.
 * Strips characters not safe for a slug and appends a short timestamp suffix
 * so retries on collision are unlikely.
 */
function slugFromName(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'user';
  return `${base}-${Date.now().toString(36)}`;
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
  // Idempotency guard: if the user already has a default membership, skip.
  const existing = await models.TenantMember.findOne({
    where: { userId: user.id, isDefault: true },
    transaction: t
  });
  if (existing) {
    const tenant = await models.Tenant.findByPk(existing.tenantId, { transaction: t });
    return { tenant, membership: existing };
  }

  // Create the personal tenant.
  const slug = slugFromName(user.name);
  const tenant = await models.Tenant.create(
    {
      slug,
      name: `${user.legalName}さんの組織`,
      status: 'active'
    },
    { transaction: t }
  );

  // Create the owner membership with all permissions and marking default.
  const membership = await models.TenantMember.create(
    {
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
      tenantSettings: true
    },
    { transaction: t }
  );

  // Seed default company classes for the tenant.
  const companyClasses = await models.CompanyClass.bulkCreate(
    DEFAULT_COMPANY_CLASSES.map((companyClass) => ({
      ...companyClass,
      tenantId: tenant.id
    })),
    { transaction: t, returning: true }
  );
  const ownCompanyClass = companyClasses.find((companyClass) => companyClass.name === '自社');

  // Create the default company for the tenant.
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

// Keep old function name as alias for backward compatibility during transition
export const bootstrapUserTenant = bootstrapTenantMember;

export default { bootstrapTenantMember, bootstrapUserTenant };
