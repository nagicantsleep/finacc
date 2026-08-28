import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals, params }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const id = parseInt(params.id, 10);

  const claim = await models.ExpenseClaim.findOne({
    where: { id, tenantId },
    include: [
      { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
      { model: models.Project, as: 'project' },
      { model: models.ExpenseAdvance, as: 'advance' },
      { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] },
      { model: models.CrossSlip, as: 'crossSlip' },
      {
        model: models.ExpenseClaimItem,
        as: 'items',
        include: [
          { model: models.ExpenseCategory, as: 'category' },
          { model: models.Company, as: 'company' }
        ]
      }
    ]
  });

  if (!claim) {
    return json({ code: -1, message: 'Expense claim not found.' }, { status: 404 });
  }

  return json({ code: 0, claim });
}
