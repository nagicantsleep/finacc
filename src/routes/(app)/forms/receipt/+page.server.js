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
      date: dateStr,
      amount: 50000,
      clientName: '株式会社〇〇 御中',
      proviso: 'コンサルティングサービス料金として',
      tax10: 5000
    }
  };
}
