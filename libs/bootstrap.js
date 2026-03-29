import models from '../models/index.js';

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
 * Idempotent: if a default UserTenant already exists for this user, returns it
 * without creating duplicates.
 *
 * Returns { tenant, membership }.
 */
export async function bootstrapUserTenant(user, t) {
  // Idempotency guard: if the user already has a default membership, skip.
  const existing = await models.UserTenant.findOne({
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
      name: user.name,
      status: 'active'
    },
    { transaction: t }
  );

  // Create the owner membership, copying legacy permission booleans and marking default.
  const membership = await models.UserTenant.create(
    {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
      status: 'active',
      isDefault: true,
      accounting: true,
      fiscalBrowsing: true,
      approvable: true,
      administrable: true,
      companyManagement: true,
      inventoryManagement: true,
      personnelManagement: true
    },
    { transaction: t }
  );

  return { tenant, membership };
}

export default { bootstrapUserTenant };
