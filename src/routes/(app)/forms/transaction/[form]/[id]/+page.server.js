import { error, redirect } from '@sveltejs/kit';
import { loadTransactionForm } from '$lib/server/form-data.js';

const FORMS = new Set(['invoice', 'receipt', 'estimate']);

export async function load({ locals, params }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');
  if (!FORMS.has(params.form)) throw error(404, 'not found');
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'not found');
  const data = await loadTransactionForm(id, locals.tenantId);
  if (!data) throw error(404, 'not found');
  return { form: params.form, ...data };
}
