import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const status = url.searchParams.get('status');
  const allMembers = url.searchParams.get('allMembers');

  const where = { tenantId };
  if (!allMembers) {
    where.userId = locals.user.id;
  }
  if (status && status !== 'all') {
    where.status = status;
  }

  const advances = await models.ExpenseAdvance.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
      { model: models.Project, as: 'project', attributes: ['id', 'name'] },
      { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] }
    ]
  });

  return json({ code: 0, advances });
}

export async function POST({ locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const userId = locals.user.id;
  const body = await request.json();
  const { title, amount, requestDate, expectedDate, purpose, projectId } = body;

  if (!title || !amount) {
    return json({ code: -1, message: 'Title and Amount are required.' }, { status: 400 });
  }

  const member = await models.TenantMember.findOne({
    where: { tenantId, userId }
  });

  const count = await models.ExpenseAdvance.count({ where: { tenantId } });
  const code = `ADV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const advance = await models.ExpenseAdvance.create({
    tenantId,
    userId,
    tenantMemberId: member ? member.id : null,
    projectId: projectId ? parseInt(projectId, 10) : null,
    code,
    title: title.trim(),
    amount: parseFloat(amount),
    requestDate: requestDate || new Date().toISOString().split('T')[0],
    expectedDate: expectedDate || null,
    purpose: purpose || '',
    status: 'pending'
  });

  return json({ code: 0, advance });
}
