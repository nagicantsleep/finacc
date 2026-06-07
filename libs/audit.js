/**
 * Audit helper — Issue #241 (E2.13).
 *
 * Single entry point for writing AuditEvent rows. Used by simulation routes
 * (and reusable elsewhere). Records to the shared AuditEvents table; the
 * (entityType, entityId) lives inside the JSONB payload and is indexed by
 * migration 20260608000200.
 *
 *   await audit({ tenantId, actorId, action, entityType, entityId, diff, reason, extra })
 *
 * When a Sequelize `transaction` is supplied it is threaded through so the
 * audit row commits/rolls back with the caller's work.
 */

import models from '../models/index.js';

export async function audit({
  tenantId,
  actorId = null,
  action,
  entityType = null,
  entityId = null,
  diff = undefined,
  reason = undefined,
  extra = undefined,
  term = undefined,
  transaction = undefined,
}) {
  if (tenantId == null) throw new Error('audit: tenantId is required');
  if (!action) throw new Error('audit: action is required');

  const payload = {};
  if (entityType != null) payload.entityType = entityType;
  if (entityId != null) payload.entityId = entityId;
  if (diff !== undefined) payload.diff = diff;
  if (reason !== undefined) payload.reason = reason;
  if (extra !== undefined) Object.assign(payload, extra);

  return models.AuditEvent.create(
    {
      tenantId,
      actorId,
      action,
      term: term ?? null,
      payload,
    },
    transaction ? { transaction } : undefined
  );
}

/**
 * Query a single entity's audit history (newest first).
 */
export async function auditHistory(entityType, entityId) {
  const { Op } = models.Sequelize;
  const rows = await models.AuditEvent.findAll({
    where: {
      [Op.and]: [
        models.sequelize.where(
          models.sequelize.json("payload.entityType"),
          entityType
        ),
        models.sequelize.where(
          models.sequelize.json("payload.entityId"),
          String(entityId)
        ),
      ],
    },
    order: [['createdAt', 'DESC']],
  });
  return rows;
}
