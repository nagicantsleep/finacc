import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const tenant = await models.Tenant.findByPk(locals.tenantId);
  const companyId = url.searchParams.get('companyId');
  let company = null;
  if (companyId) {
    company = await models.Company.findOne({ where: { id: companyId, tenantId: locals.tenantId } });
  }

  const invoiceNo = url.searchParams.get('no') || `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  return {
    tenant: {
      name: tenant?.name || 'Hieronymus Corp',
      settings: tenant?.settings || {}
    },
    company: company ? {
      name: company.officialName || company.name,
      code: company.code
    } : {
      name: '〇〇株式会社 御中',
      code: '1001'
    },
    invoice: {
      no: invoiceNo,
      date: dateStr,
      dueDate: dateStr,
      subtotal: 100000,
      tax10: 10000,
      total: 110000,
      lines: [
        { name: 'クラウド会計システム月額利用料', quantity: 1, unit: '月', unitPrice: 100000, amount: 100000, taxRate: '10%' }
      ]
    }
  };
}
