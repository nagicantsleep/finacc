import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { createCrossSlip } from '$lib/server/accounting/crossSlip.js';

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const term = parseInt(url.searchParams.get('term') || locals.term || '1', 10);
  const slips = await models.CrossSlip.findAll({
    where: { tenantId: locals.tenantId, term },
    include: [{ model: models.CrossSlipDetail, as: 'lines' }],
    order: [['year', 'DESC'], ['month', 'DESC'], ['day', 'DESC'], ['slipNo', 'DESC']]
  });

  return json({ result: 'OK', slips });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slip = await createCrossSlip(body, locals.user, locals.tenantId);
    return json({ result: 'OK', slip });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
