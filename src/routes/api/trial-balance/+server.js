import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { trialBalanceV2 } from '$lib/server/reporting/trial-balance-v2.js';
import { buildSubtotals } from '$lib/server/reporting/tb-subtotal.js';
import { withAccountParents } from '$lib/server/reporting/tb-hierarchy.js';
import { buildXlsxBuffer, fileNameFor } from '$lib/server/reporting/tb-export.js';

const parseBool = (v, dflt = false) => {
  if (v == null) return dflt;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

const parseCsv = (v) => {
  if (v == null || v === '') return [];
  return String(v).split(',').map((x) => x.trim()).filter(Boolean);
};

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;

  // Resolve term
  const fiscalYears = await models.FiscalYear.findAll({
    where: { tenantId },
    order: [['term', 'DESC']]
  });

  if (fiscalYears.length === 0) {
    return json({ version: 2, meta: null, lines: [] });
  }

  const termParam = url.searchParams.get('term');
  const term = termParam ? parseInt(termParam, 10) : (locals.term || fiscalYears[0].term);

  const month = url.searchParams.get('month') || null;
  const reportType = url.searchParams.get('reportType') || 'balance';
  const accountClassIds = parseCsv(url.searchParams.get('accountClassIds') || url.searchParams.get('class'));
  const hideZero = parseBool(url.searchParams.get('hideZero'));
  const includeUnapproved = parseBool(url.searchParams.get('includeUnapproved'), false);
  const lpParam = url.searchParams.get('languagePair');
  const lp = lpParam ? JSON.parse(lpParam) : locals.languagePair;

  try {
    const v2 = await trialBalanceV2(
      {
        tenantId,
        term,
        reportType,
        month,
        accountClassIds,
        hideZero,
        includeUnapproved,
        languagePair: lp
      },
      models
    );

    // Format Excel if format=xlsx
    if (url.searchParams.get('format') === 'xlsx') {
      v2.lines = withAccountParents(buildSubtotals(v2.lines || []));
      const tenant = await models.Tenant.findOne({ where: { id: tenantId } });
      const tenantCode = (tenant?.name || `tenant${tenantId}`).replace(/[^A-Za-z0-9_-]/g, '_');
      const buf = await buildXlsxBuffer(v2, { tenantCode });

      return new Response(Buffer.from(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileNameFor({ tenantCode, term, when: new Date() })}"`
        }
      });
    }

    return json(v2);
  } catch (e) {
    console.error('trial-balance error:', e);
    return json({ error: e.message }, { status: 500 });
  }
}