import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const categories = await models.ExpenseCategory.findAll({
    where: { tenantId, status: 'active' },
    order: [['id', 'ASC']]
  });

  return json({ code: 0, categories });
}

export async function POST({ locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ code: -1, message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const body = await request.json();
  const { name, code, accountCode, icon, description, requiresReceipt } = body;

  if (!name || !code) {
    return json({ code: -1, message: 'Name and Code are required.' }, { status: 400 });
  }

  const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const existing = await models.ExpenseCategory.findOne({
    where: { tenantId, code: cleanCode }
  });
  if (existing) {
    return json({ code: -1, message: `Category code '${cleanCode}' already exists.` }, { status: 409 });
  }

  const category = await models.ExpenseCategory.create({
    tenantId,
    name,
    code: cleanCode,
    accountCode: accountCode || '642',
    icon: icon || 'bi-receipt',
    description: description || '',
    requiresReceipt: requiresReceipt !== undefined ? requiresReceipt : true,
    status: 'active'
  });

  return json({ code: 0, category });
}
