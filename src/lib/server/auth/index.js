import models from '../../../../models/index.js';
import bcrypt from 'bcrypt';
import config from '../config.js';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = `${config.appName}_session`;

export const SESSION_PERMISSION_FIELDS = [
  'accounting', 'fiscalBrowsing', 'approvable', 'administrable',
  'companyManagement', 'inventoryManagement', 'personnelManagement',
  'tenantSettings'
];

export const buildSessionUser = (user) => ({
  id: user.id,
  name: user.name,
  legalName: user.legalName,
  legalRuby: user.legalRuby,
  email: user.email,
  telNo: user.telNo,
  deauthorizedAt: user.deauthorizedAt
});

export const authUser = async (name, password) => {
  const user = await models.User.findOne({ where: { name } });
  if (!user) {
    throw new Error('ユーザーが存在しません。');
  }
  if (!user.hashPassword || bcrypt.compareSync(password, user.hashPassword)) {
    return user;
  }
  throw new Error('パスワードが違います。');
};

export const hashPassword = (password) => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

export const resolveTenant = async (userId, sessionTenantId) => {
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
};

export const overlayMembershipPermissions = (sessionUser, membership) => {
  for (const field of SESSION_PERMISSION_FIELDS) {
    if (membership[field] !== undefined) {
      sessionUser[field] = membership[field];
    }
  }
  sessionUser.isOwner = membership.isOwner;
  sessionUser.tenantId = membership.tenantId;
};

// Lightweight signed session token management
const signSessionData = (data) => {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', config.expressSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifySessionData = (token) => {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', config.expressSecret).update(payload).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch (e) {
    return null;
  }
};

export const setSessionCookie = (cookies, sessionData) => {
  const token = signSessionData(sessionData);
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: config.sessionTtl
  });
};

export const clearSessionCookie = (cookies) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
};

export const getSessionData = (cookies) => {
  const token = cookies.get(SESSION_COOKIE_NAME);
  return verifySessionData(token);
};
