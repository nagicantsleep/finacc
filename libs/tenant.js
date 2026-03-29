import models from '../models/index.js';

/**
 * Resolve the current tenantId for a user following the epic-1 fallback chain:
 *  1. valid session.currentTenantId (active membership must exist)
 *  2. user's active default membership
 *  3. if exactly one active membership, use it
 *  4. otherwise return null (requires explicit selection)
 *
 * Returns the resolved UserTenant membership, or null.
 */
export async function resolveTenant(userId, sessionTenantId) {
  // Step 1 — validate session tenant
  if (sessionTenantId) {
    const membership = await models.UserTenant.findOne({
      where: { userId, tenantId: sessionTenantId, status: 'active' },
      include: [{ model: models.Tenant, as: 'tenant' }]
    });
    if (membership && membership.tenant && membership.tenant.status === 'active') {
      return membership;
    }
  }

  // Step 2 — default membership
  const defaultMembership = await models.UserTenant.findOne({
    where: { userId, isDefault: true, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }]
  });
  if (defaultMembership && defaultMembership.tenant && defaultMembership.tenant.status === 'active') {
    return defaultMembership;
  }

  // Step 3 — exactly one active membership
  const activeMemberships = await models.UserTenant.findAll({
    where: { userId, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }]
  });
  const live = activeMemberships.filter(m => m.tenant && m.tenant.status === 'active');
  if (live.length === 1) {
    return live[0];
  }

  // Step 4 — ambiguous or zero
  return null;
}

/**
 * Express middleware: resolve and validate current tenant membership on every
 * protected request.
 *
 * Sets req.currentTenantId and req.membership when a tenant can be resolved.
 * Clears session.currentTenantId if it was stale.
 *
 * For API requests (path starts with /api/) that need a tenant, responds 403
 * when no membership can be resolved. For screen routes it passes through
 * so the SPA can redirect to a tenant-selection page.
 */
export const requireTenant = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next();
  }

  const userId = req.session.user.id;
  const sessionTenantId = req.session.currentTenantId;

  try {
    const membership = await resolveTenant(userId, sessionTenantId);

    if (membership) {
      // Update session if we resolved to a different tenant via fallback
      if (req.session.currentTenantId !== membership.tenantId) {
        req.session.currentTenantId = membership.tenantId;
      }
      req.currentTenantId = membership.tenantId;
      req.membership = membership;

      // Overlay tenant-scoped permissions onto req.session.user so the
      // frontend sees the correct permission flags for the active tenant.
      const PERM_FIELDS = [
        'accounting', 'fiscalBrowsing', 'approvable', 'administrable',
        'companyManagement', 'inventoryManagement', 'personnelManagement'
      ];
      for (const field of PERM_FIELDS) {
        if (membership[field] !== undefined) {
          req.session.user[field] = membership[field];
        }
      }

      return next();
    }

    // No resolvable tenant — destroy session and force re-login so the
    // bootstrap path (signup) or login handler can set currentTenantId.
    req.logout((err) => {
      req.session.destroy(() => {
        if (req.path.startsWith('/api/')) {
          res.status(401).json({ result: 'NG', message: 'No active tenant. Please log in again.' });
        } else {
          res.redirect('/login');
        }
      });
    });
  } catch (e) {
    console.log('requireTenant error', e);
    return next();
  }
};

/**
 * Switch the current session tenant to a given tenantId.
 * Validates that the user has an active membership in that tenant.
 * Returns the membership on success, throws on failure.
 */
export async function switchTenant(userId, tenantId) {
  const membership = await models.UserTenant.findOne({
    where: { userId, tenantId, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }]
  });
  if (!membership || !membership.tenant || membership.tenant.status !== 'active') {
    throw new Error('No active membership for that tenant');
  }
  return membership;
}

export default { resolveTenant, requireTenant, switchTenant };
