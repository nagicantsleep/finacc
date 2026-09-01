import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';
import {
  getTransaction,
  listTransactions
} from '$lib/server/master/transaction-api.js';

const Op = models.Sequelize.Op;
const VIEW_STATES = new Set(['list', 'entry', 'new']);

export function parseTransactionView(rest) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  const viewState = parts[0] || 'list';
  const entryId = viewState === 'entry' ? parseInt(parts[1], 10) : NaN;

  return {
    viewState: VIEW_STATES.has(viewState) ? viewState : null,
    entryId: Number.isFinite(entryId) ? entryId : null
  };
}

export function transactionFiltersFromSearchParams(searchParams) {
  const filters = {};
  for (const key of ['kind', 'company', 'task', 'upper', 'lower', 'order']) {
    const value = searchParams.get(key);
    if (value != null && value !== '') {
      filters[key] = value;
    }
  }
  return filters;
}

export function transactionQueryFromFilters(filters) {
  const query = {};
  for (const key of ['kind', 'company', 'task', 'upper', 'lower', 'order']) {
    if (filters[key] != null && filters[key] !== '') {
      query[key] = filters[key];
    }
  }
  return query;
}

export async function listTransactionKinds(tenantId) {
  const rows = await models.TransactionKind.findAll({
    where: { tenantId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return rows.map((row) => asJson(row));
}

export async function listMemberUsers(tenantId) {
  const members = await models.TenantMember.findAll({
    where: {
      tenantId,
      userId: { [Op.ne]: null }
    },
    order: [['tradingName', 'ASC']],
    include: [{ model: models.User, as: 'user' }]
  });

  const users = [];
  for (const member of members) {
    if (member.userId) {
      users.push({
        id: member.userId,
        name: member.tradingName || member.user?.legalName || null
      });
    }
  }
  return users;
}

export function newTransactionTemplate() {
  const now = new Date();
  const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    issueDate,
    tax: 0,
    amount: 0,
    lines: [
      {
        itemId: null,
        itemName: '',
        itemSpec: '',
        unitPrice: 0,
        itemNumber: 0,
        unit: '',
        amount: 0,
        tax: 0,
        description: ''
      }
    ]
  };
}

export async function loadTransactionPageData({
  tenantId,
  viewState,
  entryId,
  filters
}) {
  const [transactionKinds, users] = await Promise.all([
    listTransactionKinds(tenantId),
    listMemberUsers(tenantId)
  ]);

  if (viewState === 'list') {
    const { transactions } = await listTransactions(
      tenantId,
      transactionQueryFromFilters(filters)
    );
    return {
      transactions,
      selectedTransaction: null,
      transactionKinds,
      users
    };
  }

  if (viewState === 'new') {
    return {
      transactions: [],
      selectedTransaction: newTransactionTemplate(),
      transactionKinds,
      users
    };
  }

  const selected = await getTransaction(tenantId, entryId);
  return {
    transactions: [],
    selectedTransaction: selected?.transaction || null,
    transactionKinds,
    users
  };
}
