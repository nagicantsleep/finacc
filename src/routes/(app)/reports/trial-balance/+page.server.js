import models from '$lib/server/db/index.js';
import { trialBalanceV2 } from '$lib/server/reporting/trial-balance-v2.js';

function parseCsv(v) {
  if (v == null || v === '') return [];
  return String(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, parent, depends }) {
  depends('app:trial-balance');
  const { currentFy } = await parent();

  const term = parseInt(url.searchParams.get('term') || currentFy?.term, 10);
  const reportType = url.searchParams.get('reportType') || 'balance';
  const month = url.searchParams.get('month') || null;
  const hideZero = url.searchParams.get('hideZero') === 'true';
  const accountClassIds = parseCsv(
    url.searchParams.get('accountClassIds') || url.searchParams.get('class')
  );

  if (!Number.isFinite(term)) {
    return { term: null, tb: { version: 2, meta: null, lines: [] } };
  }

  const tb = await trialBalanceV2(
    {
      tenantId: locals.tenantId,
      term,
      reportType,
      month,
      accountClassIds,
      hideZero,
      includeUnapproved: false,
      languagePair: null
    },
    models
  );

  return { term, tb };
}
