import models from '$lib/server/db/index.js';
import {
  getSessionData,
  setSessionCookie,
  resolveTenant,
  buildSessionUser,
  overlayMembershipPermissions
} from '$lib/server/auth/index.js';
import { json, redirect } from '@sveltejs/kit';
import { respondFormPdf } from '$lib/server/form-pdf.js';
import { GENERIC_ERROR_MESSAGE, NOT_FOUND_MESSAGE } from '$lib/errors.js';

const PUBLIC_PATHS = ['/login', '/signup', '/api/user/login', '/api/user/signup', '/api/health'];

const USER_SCOPE_PATHS = [
  '/logon',
  '/api/user/password',
  '/api/user/profile',
  '/api/user/tenants',
  '/api/user/session-status',
  '/api/user/select-tenant',
  '/api/user/logoff',
  '/api/user/tenant',
  '/logout'
];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const pathname = event.url.pathname;

  // 1. Check Public Routes
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Retrieve session from signed cookie
  const sessionData = getSessionData(event.cookies);
  let user = null;
  let currentTenantId = sessionData?.currentTenantId || null;
  let term = sessionData?.term || null;

  if (sessionData?.userId) {
    try {
      const dbUser = await models.User.findByPk(sessionData.userId);
      if (dbUser && !dbUser.deauthorizedAt) {
        user = buildSessionUser(dbUser);
      }
    } catch (e) {
      console.error('[hooks.server.js] Error fetching user:', e);
    }
  }

  // If user is not authenticated
  if (!user) {
    if (isPublic) {
      event.locals.user = null;
      event.locals.tenantId = null;
      return resolve(event);
    }

    if (pathname.startsWith('/api/')) {
      return json({ result: 'NG', message: 'Not authenticated.' }, { status: 401 });
    }

    throw redirect(303, '/login');
  }

  // User is authenticated
  event.locals.user = user;
  event.locals.term = term;

  // 2. Check User-Scope Routes
  const isUserScope = USER_SCOPE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Resolve Tenant
  const membership = await resolveTenant(user.id, currentTenantId);

  if (membership) {
    event.locals.tenantId = membership.tenantId;
    event.locals.membership = membership;
    overlayMembershipPermissions(user, membership);

    // Sync session cookie if tenant changed via fallback
    if (currentTenantId !== membership.tenantId) {
      setSessionCookie(event.cookies, {
        userId: user.id,
        currentTenantId: membership.tenantId,
        term: term
      });
    }
  } else {
    event.locals.tenantId = null;
    event.locals.membership = null;
  }

  // If user-scope route or public route (already logged in)
  if (isUserScope || isPublic) {
    // If logged in user hits /login or /signup, redirect to /workspace or /logon
    if (pathname === '/login' || pathname === '/signup') {
      if (event.locals.tenantId) {
        throw redirect(303, '/workspace');
      }
      throw redirect(303, '/logon');
    }
    return resolve(event);
  }

  // 3. Tenant-Scope Routes: Must have valid resolved tenant
  if (!event.locals.tenantId) {
    if (pathname.startsWith('/api/')) {
      return json(
        {
          result: 'NG',
          code: 'TENANT_SELECTION_REQUIRED',
          message: 'No active tenant selected.',
          redirectTo: '/logon'
        },
        { status: 403 }
      );
    }
    throw redirect(303, '/logon');
  }

  // Key Invariant check: If FiscalYear count is 0, redirect /workspace, /home to /setup (Phase 1 -> Phase 2 wizard)
  if (pathname === '/home' || pathname === '/' || pathname === '/workspace') {
    try {
      const fyCount = await models.FiscalYear.count({
        where: { tenantId: event.locals.tenantId }
      });
      if (fyCount === 0) {
        throw redirect(303, '/setup');
      }
      if (pathname === '/home' || pathname === '/') {
        throw redirect(303, '/workspace');
      }
    } catch (e) {
      if (e?.status === 303) throw e;
      console.error('[hooks.server.js] FiscalYear count error:', e);
    }
  }

  const pdf = await respondFormPdf(event);
  if (pdf) return pdf;

  return resolve(event);
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, event, status, message }) {
  console.error('[handleError]', status, event.url.pathname, error?.message || error);
  if (status === 404) {
    return { message: NOT_FOUND_MESSAGE, status: 404 };
  }
  return { message: message || GENERIC_ERROR_MESSAGE, status };
}
