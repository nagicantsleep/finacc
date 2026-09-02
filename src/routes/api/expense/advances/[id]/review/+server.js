import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function PUT({ locals, params, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const reviewerId = locals.user.id;
  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { status, reviewComment } = body;

  if (!['approved', 'disbursed', 'settled', 'rejected'].includes(status)) {
    return json({ code: -1, message: 'Invalid review status.' }, { status: 400 });
  }

  const advance = await models.ExpenseAdvance.findOne({
    where: { id, tenantId }
  });

  if (!advance) {
    return json({ code: -1, message: 'Advance request not found.' }, { status: 404 });
  }

  advance.status = status;
  advance.reviewedById = reviewerId;
  advance.reviewedAt = new Date();
  if (reviewComment) advance.reviewComment = reviewComment;
  await advance.save();

  return json({ code: 0, advance });
}
