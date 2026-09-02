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

  if (!['approved', 'settled', 'rejected'].includes(status)) {
    return json({ code: -1, message: 'Invalid review status.' }, { status: 400 });
  }

  const claim = await models.ExpenseClaim.findOne({
    where: { id, tenantId }
  });

  if (!claim) {
    return json({ code: -1, message: 'Expense claim not found.' }, { status: 404 });
  }

  claim.status = status;
  claim.reviewedById = reviewerId;
  claim.reviewedAt = new Date();
  if (reviewComment) claim.reviewComment = reviewComment;
  await claim.save();

  return json({ code: 0, claim });
}
