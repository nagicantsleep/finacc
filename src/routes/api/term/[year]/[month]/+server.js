import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
const Op = models.Sequelize.Op;

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const year = parseInt(params.year, 10);
  const month = parseInt(params.month, 10);

  if (isNaN(year) || isNaN(month)) {
    return json({});
  }

  try {
    const fy = await models.FiscalYear.findOne({
      where: {
        tenantId: locals.tenantId,
        [Op.and]: {
          startDate: {
            [Op.lte]: new Date(year, month - 1, 2)
          },
          endDate: {
            [Op.gte]: new Date(year, month - 1, 1)
          }
        }
      }
    });

    return json(fy || {});
  } catch (e) {
    return json({});
  }
}
