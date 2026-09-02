import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const tenant = await models.Tenant.findByPk(locals.tenantId);
  const receiptNo = url.searchParams.get('no') || `REC-${Date.now().toString().slice(-6)}`;
  const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  return {
    tenant: {
      name: tenant?.name || 'Hieronymus Corp'
    },
    receipt: {
      no: receiptNo,
      issueDate: dateStr,
      amount: 50000,
      tax: 5000,
      taxClass: 1,
      companyName: '株式会社〇〇 御中',
      zip: '100-0001',
      address1: '東京都千代田区千代田1-1',
      address2: '',
      handleUser: { memberships: [], legalName: locals.user?.name || '担当者' },
      lines: [
        { itemId: 1, itemName: 'コンサルティングサービス料金', itemSpec: '', unitPrice: 50000, itemNumber: 1, unit: '式', amount: 50000, tax: 5000, taxRule: { taxClass: 1 }, description: '領収済' }
      ]
    }
  };
}
