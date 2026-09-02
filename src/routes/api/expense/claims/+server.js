import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
const Op = models.Sequelize.Op;

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const status = url.searchParams.get('status');
  const allMembers = url.searchParams.get('allMembers');
  const q = url.searchParams.get('q');

  const where = { tenantId };
  if (!allMembers) {
    where.userId = locals.user.id;
  }
  if (status && status !== 'all') {
    where.status = status;
  }
  if (q && q.trim()) {
    const search = `%${q.trim()}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: search } },
      { code: { [Op.iLike]: search } }
    ];
  }

  const claims = await models.ExpenseClaim.findAll({
    where,
    order: [['claimDate', 'DESC'], ['id', 'DESC']],
    include: [
      { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
      { model: models.Project, as: 'project', attributes: ['id', 'name'] },
      { model: models.ExpenseAdvance, as: 'advance', attributes: ['id', 'code', 'title', 'amount'] },
      { model: models.ExpenseClaimItem, as: 'items', attributes: ['id'] }
    ]
  });

  const results = claims.map((c) => {
    const plain = c.toJSON();
    plain.itemCount = plain.items ? plain.items.length : 0;
    delete plain.items;
    return plain;
  });

  return json({ code: 0, claims: results });
}

export async function POST({ locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = locals.tenantId;
    const userId = locals.user.id;
    const body = await request.json();
    const { title, claimDate, projectId, expenseAdvanceId, items, note } = body;

    if (!title || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return json({ code: -1, message: 'Title and at least one expense item are required.' }, { status: 400 });
    }

    const member = await models.TenantMember.findOne({
      where: { tenantId, userId },
      transaction
    });

    let advanceAmount = 0;
    if (expenseAdvanceId) {
      const advance = await models.ExpenseAdvance.findOne({
        where: { id: parseInt(expenseAdvanceId, 10), tenantId },
        transaction
      });
      if (advance) {
        advanceAmount = parseFloat(advance.amount || 0);
      }
    }

    let totalAmount = 0;
    for (const it of items) {
      totalAmount += parseFloat(it.amount || 0);
    }

    const netAmount = Math.max(0, totalAmount - advanceAmount);

    const count = await models.ExpenseClaim.count({ where: { tenantId }, transaction });
    const code = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const claim = await models.ExpenseClaim.create({
      tenantId,
      userId,
      tenantMemberId: member ? member.id : null,
      projectId: projectId ? parseInt(projectId, 10) : null,
      expenseAdvanceId: expenseAdvanceId ? parseInt(expenseAdvanceId, 10) : null,
      code,
      title: title.trim(),
      claimDate: claimDate || new Date().toISOString().split('T')[0],
      totalAmount,
      advanceAmount,
      netAmount,
      status: 'submitted',
      note: note || ''
    }, { transaction });

    // Create item lines
    for (const it of items) {
      await models.ExpenseClaimItem.create({
        tenantId,
        expenseClaimId: claim.id,
        expenseCategoryId: parseInt(it.expenseCategoryId, 10),
        companyId: it.companyId ? parseInt(it.companyId, 10) : null,
        voucherId: it.voucherId ? parseInt(it.voucherId, 10) : null,
        date: it.date || claim.claimDate,
        amount: parseFloat(it.amount || 0),
        taxAmount: parseFloat(it.taxAmount || 0),
        taxRuleId: it.taxRuleId ? parseInt(it.taxRuleId, 10) : null,
        description: it.description || 'Chi phí công tác',
        receiptUrl: it.receiptUrl || null
      }, { transaction });
    }

    await transaction.commit();

    const fullClaim = await models.ExpenseClaim.findByPk(claim.id, {
      include: [
        { model: models.ExpenseClaimItem, as: 'items', include: [{ model: models.ExpenseCategory, as: 'category' }] },
        { model: models.ExpenseAdvance, as: 'advance' }
      ]
    });

    return json({ code: 0, claim: fullClaim });
  } catch (e) {
    await transaction.rollback();
    return json({ code: -1, message: e.message }, { status: 500 });
  }
}
