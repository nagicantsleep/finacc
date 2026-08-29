import models from '$lib/server/db/index.js';
import {
  authUser,
  overlayMembershipPermissions,
  setSessionCookie,
  clearSessionCookie,
  getSessionData
} from '$lib/server/auth/index.js';
import { switchTenant } from '$lib/server/tenant.js';
import { bootstrapTenantMember, seedTenantBase, slugFromName } from '$lib/server/auth/bootstrap.js';

const Op = models.Sequelize.Op;

function sessionPayload(cookies, userId, currentTenantId) {
  const prev = getSessionData(cookies) || {};
  return {
    userId,
    currentTenantId: currentTenantId ?? null,
    term: prev.term || null
  };
}

function writeSession(cookies, userId, currentTenantId) {
  setSessionCookie(cookies, sessionPayload(cookies, userId, currentTenantId));
}

async function activeMemberships(userId) {
  const memberships = await models.TenantMember.findAll({
    where: { userId, status: 'active' },
    include: [
      {
        model: models.Tenant,
        as: 'tenant',
        where: { status: 'active' }
      }
    ],
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'ASC']
    ]
  });
  return memberships;
}

async function seedLanguagePair(userId, picked) {
  if (
    !picked?.primary ||
    !picked?.secondary ||
    !['ja', 'vi', 'en'].includes(picked.primary) ||
    !['ja', 'vi', 'en'].includes(picked.secondary) ||
    picked.primary === picked.secondary
  ) {
    return;
  }
  const dbUser = await models.User.findByPk(userId);
  if (dbUser && !dbUser.languagePair) {
    dbUser.languagePair = { primary: picked.primary, secondary: picked.secondary };
    await dbUser.save();
  }
}

export async function createOwnedTenant(user, name, transaction, slugInput) {
  const baseSlug = (slugInput || name || user.legalName || user.name || 'tenant')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'tenant';
  const slug = slugInput ? baseSlug : slugFromName(baseSlug.replace(/-+$/, ''));

  const existingTenant = await models.Tenant.findOne({
    where: { [Op.or]: [{ slug }, { name }] },
    transaction
  });
  if (existingTenant) {
    const duplicateField = existingTenant.slug === slug ? 'スラッグ' : 'テナント名';
    const error = new Error(`${duplicateField}は既に使用されています。`);
    error.statusCode = 409;
    throw error;
  }

  return seedTenantBase(user, { name, slug, isDefault: false }, transaction);
}

export async function loginWithPassword(cookies, body) {
  const identifier = body.user_name || body.username;
  const password = body.password;
  if (!identifier || !password) {
    return { status: 200, payload: { result: 'NG', message: 'ユーザー名またはパスワードが違います。' } };
  }

  let dbUser;
  try {
    dbUser = await authUser(identifier, password);
  } catch {
    return { status: 200, payload: { result: 'NG', message: 'ユーザー名またはパスワードが違います。' } };
  }

  if (dbUser.deauthorizedAt && dbUser.deauthorizedAt < new Date()) {
    return { status: 200, payload: { result: 'NG', message: `user ${dbUser.name} not found` } };
  }

  try {
    await seedLanguagePair(dbUser.id, body.languagePair);
  } catch (lpErr) {
    console.log('login languagePair seed error', lpErr);
  }

  const memberships = await activeMemberships(dbUser.id);

  if (memberships.length === 0) {
    const t = await models.sequelize.transaction();
    try {
      const result = await bootstrapTenantMember(dbUser, {}, t);
      await t.commit();
      writeSession(cookies, dbUser.id, result.membership.tenantId);
      return { status: 200, payload: { result: 'OK' } };
    } catch (be) {
      await t.rollback();
      console.log('tenant bootstrap error on login', be);
      return { status: 200, payload: { result: 'NG', message: 'テナントの作成に失敗しました。' } };
    }
  }

  if (memberships.length === 1) {
    writeSession(cookies, dbUser.id, memberships[0].tenantId);
    return { status: 200, payload: { result: 'OK' } };
  }

  const defaultMembership = memberships.find((m) => m.isDefault);
  if (defaultMembership) {
    writeSession(cookies, dbUser.id, defaultMembership.tenantId);
    return { status: 200, payload: { result: 'OK' } };
  }

  writeSession(cookies, dbUser.id, null);
  return { status: 200, payload: { result: 'OK', requiresTenantSelection: true } };
}

export async function signupUser(body) {
  const user_name = body.user_name;
  const password = body.password;
  const legalName = body.legalName;
  const email = body.email;

  if (!user_name || !user_name.trim()) {
    return { status: 200, payload: { result: 'NG', message: 'ユーザー名を入力してください。' } };
  }
  if (!password || password.length < 8) {
    return { status: 200, payload: { result: 'NG', message: 'パスワードは8文字以上で入力してください。' } };
  }
  if (!legalName || !legalName.trim()) {
    return { status: 200, payload: { result: 'NG', message: '氏名を入力してください。' } };
  }
  if (!email || !email.trim()) {
    return { status: 200, payload: { result: 'NG', message: 'メールアドレスを入力してください。' } };
  }
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(user_name)) {
    return {
      status: 200,
      payload: { result: 'NG', message: 'ユーザー名は半角英数字とアンダースコア、4〜20文字で入力してください。' }
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 200, payload: { result: 'NG', message: '有効なメールアドレスを入力してください。' } };
  }

  try {
    const existingUser = await models.User.check(user_name, password);
    if (existingUser) {
      return {
        status: 200,
        payload: { result: 'NG', message: `ユーザー名「${user_name}」は既に使用されています。` }
      };
    }
  } catch (err) {
    return {
      status: 200,
      payload: { result: 'NG', message: typeof err === 'string' ? err : '登録に失敗しました。' }
    };
  }

  const existingEmail = await models.User.findOne({
    where: { email: email.trim().toLowerCase() }
  });
  if (existingEmail) {
    return { status: 200, payload: { result: 'NG', message: 'このメールアドレスは既に登録されています。' } };
  }

  const transaction = await models.sequelize.transaction();
  try {
    const user = models.User.build({
      name: user_name.trim(),
      legalName: legalName.trim(),
      email: email.trim().toLowerCase(),
      legalRuby: body.legalRuby?.trim() || null,
      legalSex: body.legalSex != null ? parseInt(body.legalSex, 10) : null,
      birthDate: body.birthDate || null,
      telNo: body.telNo?.trim() || null,
      zip: body.zip?.trim() || null,
      address1: body.address1?.trim() || null,
      address2: body.address2?.trim() || null
    });
    user.password = password;
    await user.save({ transaction });
    await bootstrapTenantMember(user, {}, transaction);
    await transaction.commit();
    return { status: 200, payload: { result: 'OK' } };
  } catch (err) {
    await transaction.rollback();
    console.log('signup error', err);
    return { status: 200, payload: { result: 'NG', message: err.message || '登録に失敗しました。' } };
  }
}

export async function listTenants(user, activeTenantId) {
  const memberships = await activeMemberships(user.id);
  const tenants = memberships.map((m) => ({
    tenantId: m.tenantId,
    tenantName: m.tenant.name,
    tenantSlug: m.tenant.slug,
    isOwner: m.isOwner,
    isDefault: m.isDefault,
    status: m.status
  }));
  return {
    status: 200,
    payload: {
      result: 'OK',
      userName: user.legalName || user.name,
      activeTenantId: activeTenantId || null,
      tenants
    }
  };
}

export async function getSessionStatus(user, tenantId) {
  const memberships = await activeMemberships(user.id);
  return {
    status: 200,
    payload: {
      result: 'OK',
      authenticated: true,
      activeTenantId: tenantId || null,
      needsTenantSelection: !tenantId,
      membershipCount: memberships.length,
      user: {
        id: user.id,
        name: user.name,
        legalName: user.legalName
      }
    }
  };
}

export async function selectUserTenant(cookies, user, tenantIdRaw) {
  const tenantId = parseInt(tenantIdRaw, 10);
  if (!tenantId) {
    return { status: 400, payload: { result: 'NG', message: 'テナントIDが指定されていません。' } };
  }
  try {
    const membership = await switchTenant(user.id, tenantId);
    overlayMembershipPermissions(user, membership);
    writeSession(cookies, user.id, membership.tenantId);
    return {
      status: 200,
      payload: {
        result: 'OK',
        tenantId: membership.tenantId,
        tenantName: membership.tenant.name,
        redirectTo: '/workspace'
      }
    };
  } catch {
    return { status: 403, payload: { result: 'NG', message: 'そのテナントへのアクセス権限がありません。' } };
  }
}

export async function createUserTenant(user, body) {
  const name = body.name?.trim();
  const slug = body.slug?.trim();
  if (!name) {
    return { status: 400, payload: { result: 'NG', message: 'テナント名を入力してください。' } };
  }
  const dbUser = await models.User.findByPk(user.id);
  const transaction = await models.sequelize.transaction();
  try {
    const result = await createOwnedTenant(dbUser, name, transaction, slug);
    await transaction.commit();
    return {
      status: 200,
      payload: {
        result: 'OK',
        tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug }
      }
    };
  } catch (err) {
    await transaction.rollback();
    console.error('tenant create error', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return {
        status: 409,
        payload: { result: 'NG', message: 'スラッグまたはテナント名が既に使用されています。' }
      };
    }
    return {
      status: err.statusCode || 500,
      payload: { result: 'NG', message: err.message || 'テナントの作成に失敗しました。' }
    };
  }
}

export async function updateUserTenant(user, tenantIdRaw, body) {
  const tenantId = parseInt(tenantIdRaw, 10);
  const name = body.name?.trim();
  if (!tenantId || !name) {
    return { status: 400, payload: { result: 'NG', message: '更新内容が不正です。' } };
  }
  const membership = await models.TenantMember.findOne({
    where: {
      userId: user.id,
      tenantId,
      isOwner: true,
      status: 'active'
    },
    include: [{ model: models.Tenant, as: 'tenant', where: { status: 'active' } }]
  });
  if (!membership?.tenant) {
    return { status: 403, payload: { result: 'NG', message: 'そのテナントを管理できません。' } };
  }
  membership.tenant.name = name;
  await membership.tenant.save();
  return {
    status: 200,
    payload: {
      result: 'OK',
      tenant: { id: membership.tenant.id, name: membership.tenant.name, slug: membership.tenant.slug }
    }
  };
}

export async function deleteUserTenant(cookies, user, tenantIdRaw) {
  const tenantId = parseInt(tenantIdRaw, 10);
  if (!tenantId) {
    return { status: 400, payload: { result: 'NG', message: 'テナントIDが不正です。' } };
  }
  const transaction = await models.sequelize.transaction();
  try {
    const membership = await models.TenantMember.findOne({
      where: {
        userId: user.id,
        tenantId,
        isOwner: true,
        status: 'active'
      },
      include: [{ model: models.Tenant, as: 'tenant', where: { status: 'active' } }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!membership?.tenant) {
      await transaction.rollback();
      return { status: 403, payload: { result: 'NG', message: 'そのテナントを管理できません。' } };
    }

    const activeOwners = await models.TenantMember.count({
      where: { tenantId, isOwner: true, status: 'active' },
      transaction
    });
    if (activeOwners <= 1) {
      await transaction.rollback();
      return {
        status: 400,
        payload: { result: 'NG', message: '最後の有効なオーナーのテナントは削除できません。' }
      };
    }

    membership.status = 'inactive';
    membership.isDefault = false;
    await membership.save({ transaction });

    const remainingActiveMembers = await models.TenantMember.count({
      where: { tenantId, status: 'active' },
      transaction
    });
    if (remainingActiveMembers === 0) {
      membership.tenant.status = 'inactive';
      await membership.tenant.save({ transaction });
    }

    const session = getSessionData(cookies);
    const currentTenantId = session?.currentTenantId === tenantId ? null : session?.currentTenantId;
    writeSession(cookies, user.id, currentTenantId);
    await transaction.commit();
    return { status: 200, payload: { result: 'OK' } };
  } catch (err) {
    await transaction.rollback();
    console.error('tenant delete error', err);
    return { status: 500, payload: { result: 'NG', message: 'テナントの削除に失敗しました。' } };
  }
}

export async function logoffUser(cookies, user) {
  const memberships = await activeMemberships(user.id);
  if (memberships.length <= 1) {
    clearSessionCookie(cookies);
    return { status: 200, payload: { result: 'OK', action: 'logout' } };
  }
  writeSession(cookies, user.id, null);
  return { status: 200, payload: { result: 'OK', action: 'select' } };
}

export function currentUserPayload(user) {
  return { user };
}
