import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const year = parseInt(params.year, 10);
  const month = parseInt(params.month, 10);

  const slips = await models.CrossSlip.findAll({
    where: {
      tenantId: locals.tenantId,
      year,
      month
    },
    include: [
      {
        model: models.CrossSlipDetail,
        as: 'lines',
        include: [
          { model: models.Account, as: 'debit', foreignKey: 'debitAccount' },
          { model: models.Account, as: 'credit', foreignKey: 'creditAccount' }
        ]
      }
    ],
    order: [
      ['day', 'ASC'],
      ['no', 'ASC']
    ]
  });

  return json({
    result: 'OK',
    journal: slips.map((s) => s.toJSON())
  });
}
