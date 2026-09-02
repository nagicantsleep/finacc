import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';
import models from '$lib/server/db/index.js';

export async function PUT({ locals, request }) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  if (!locals.user.approvable) {
    return json({ code: -10, message: 'this account can not approve' });
  }
  const body = await request.json().catch(() => ({}));
  const slip = await models.CrossSlip.findOne({
    where: {
      tenantId: locals.tenantId,
      year: body.year,
      month: body.month,
      no: body.no
    }
  });
  if (!slip) {
    return json({ code: -1, message: 'record not found' });
  }
  slip.approvedAt = body.approvedAt;
  slip.approvedBy = body.approvedAt ? locals.user.id : null;
  slip.updatedBy = locals.user.id;
  await slip.save();
  return json({ code: 0, id: slip.id });
}
