import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

export async function getCrossSlipDetail(tenantId, id) {
  const row = await models.CrossSlipDetail.findOne({
    where: { id, tenantId }
  });
  return asJson(row);
}

export async function updateCrossSlipDetail(tenantId, body) {
  const id = body?.id;
  if (id == null) return { ok: false, status: 400, payload: { code: -1 } };
  const row = await models.CrossSlipDetail.findOne({
    where: { id, tenantId }
  });
  if (!row) return { ok: false, status: 404, payload: { code: -1 } };
  const patch = { ...body };
  delete patch.tenantId;
  row.set(patch);
  row.tenantId = tenantId;
  await row.save();
  return { ok: true, payload: asJson(row) };
}
