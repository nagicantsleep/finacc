import models from '../models/index.js';

const SESSION_PERMISSION_FIELDS = [
  'accounting', 'fiscalBrowsing', 'approvable', 'administrable',
  'companyManagement', 'inventoryManagement', 'personnelManagement',
  'tenantSettings'
];

/**
 * Resolve the current tenantId for a user following the epic-1 fallback chain:
 *  1. valid session.currentTenantId (active membership must exist)
 *  2. user's active default membership
 *  3. if exactly one active membership, use it
 *  4. otherwise return null (requires explicit selection)
 *
 * Returns the resolved TenantMember membership, or null.
 */
export async function resolveTenant(userId, sessionTenantId) {
  // Step 1 — validate session tenant
  if (sessionTenantId) {
    const membership = await models.TenantMember.findOne({
      where: { userId, tenantId: sessionTenantId, status: 'active' },
      include: [{ model: models.Tenant, as: 'tenant' }]
    });
    if (membership && membership.tenant && membership.tenant.status === 'active') {
      return membership;
    }
  }

  // Step 2 — default membership
  const defaultMembership = await models.TenantMember.findOne({
    where: { userId, isDefault: true, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }]
  });
  if (defaultMembership && defaultMembership.tenant && defaultMembership.tenant.status === 'active') {
    return defaultMembership;
  }

  // Step 3 — exactly one active membership
  const activeMemberships = await models.TenantMember.findAll({
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
    const rawPath = req.originalUrl || req.url;
    const publicPaths = ['/api/user/login', '/api/user/signup'];
    if (publicPaths.some(p => rawPath.startsWith(p))) {
      return next();
    }
    if (rawPath.startsWith('/api/')) {
      return res.status(401).json({ result: 'NG', message: 'Not authenticated.' });
    }
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
      overlayMembershipPermissions(req.session.user, membership);

      return next();
    }

    const rawPath = req.originalUrl || req.url;
    clearMembershipPermissions(req.session.user);
    if (req.session.currentTenantId) {
      req.session.currentTenantId = null;
    }

    const tenantlessApiPaths = [
      '/api/user',
      '/api/user/password',
      '/api/user/profile',
      '/api/user/tenants',
      '/api/user/session-status',
      '/api/user/select-tenant',
      '/api/user/logoff'
    ];
    if (tenantlessApiPaths.includes(rawPath) || rawPath.startsWith('/api/user/tenant')) {
      return next();
    }

    if (rawPath.startsWith('/api/')) {
      return res.status(403).json({
        result: 'NG',
        code: 'TENANT_SELECTION_REQUIRED',
        message: 'No active tenant selected.',
        redirectTo: '/logon'
      });
    }

    return res.redirect('/logon');
  } catch (e) {
    console.log('requireTenant error', e);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ result: 'NG', message: 'Internal server error resolving tenant.' });
    }
    return res.redirect('/login');
  }
};

/**
 * Switch the current session tenant to a given tenantId.
 * Validates that the user has an active membership in that tenant.
 * Returns the membership on success, throws on failure.
 */
export async function switchTenant(userId, tenantId) {
  const membership = await models.TenantMember.findOne({
    where: { userId, tenantId, status: 'active' },
    include: [{ model: models.Tenant, as: 'tenant' }]
  });
  if (!membership || !membership.tenant || membership.tenant.status !== 'active') {
    throw new Error('No active membership for that tenant');
  }
  return membership;
}

export function clearMembershipPermissions(sessionUser) {
  for (const field of SESSION_PERMISSION_FIELDS) {
    delete sessionUser[field];
  }

  delete sessionUser.isOwner;
  delete sessionUser.tenantId;
}

/**
 * Overlay TenantMember permissions onto session user object for backward
 * compatibility with frontend permission checks.
 */
export function overlayMembershipPermissions(sessionUser, membership) {
  for (const field of SESSION_PERMISSION_FIELDS) {
    if (membership[field] !== undefined) {
      sessionUser[field] = membership[field];
    }
  }

  sessionUser.isOwner = membership.isOwner;
  sessionUser.tenantId = membership.tenantId;
}

export default { resolveTenant, requireTenant, switchTenant, overlayMembershipPermissions, clearMembershipPermissions };
