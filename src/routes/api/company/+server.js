import { json } from '@sveltejs/kit';
import { listCompanies } from '$lib/server/accounting/company-list.js';
import models from '$lib/server/db/index.js';

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const kind = parseInt(url.searchParams.get('kind') || '-1', 10);
  const companies = await listCompanies(locals.tenantId, { kind });
  return json({ result: 'OK', companies });
}

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const company = await models.Company.create({
      tenantId: locals.tenantId,
      name: body.name,
      chargeName: body.chargeName || '',
      companyClassId: body.companyClassId
    });
    return json({ result: 'OK', company });
  } catch (e) {
    return json({ result: 'NG', message: e.message }, { status: 400 });
  }
}
