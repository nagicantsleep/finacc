import JournalView from '$lib/components/forms/explanatory-journal/explanatory-journal.svelte';
import GeneralLedgerView from '$lib/components/forms/general-ledger/general-ledger.svelte';
import SubsidiaryLedgerView from '$lib/components/forms/subsidiary-ledger/subsidiary-ledger.svelte';
import FinancialStatementView from '$lib/components/forms/financial-statement/financial-statement.svelte';
import TrialBalanceView from '$lib/components/forms/trial-balance/trial-balance.svelte';
import { htmlToPdf, originFromEnv } from '$lib/server/print.js';
import {
  loadFinancialStatementForm,
  loadGeneralLedgerForm,
  loadJournalForm,
  loadSubsidiaryLedgerForm,
  loadTrialBalanceForm,
  resolveTerm
} from '$lib/server/form-data.js';

const FORMS = {
  '/forms/explanatory-journal': {
    filename: 'explanatory-journal.pdf',
    load: loadJournalForm,
    View: JournalView
  },
  '/forms/general-ledger': {
    filename: 'general-ledger.pdf',
    load: loadGeneralLedgerForm,
    View: GeneralLedgerView
  },
  '/forms/subsidiary-ledger': {
    filename: 'subsidiary-ledger.pdf',
    load: loadSubsidiaryLedgerForm,
    View: SubsidiaryLedgerView
  },
  '/forms/financial-statement': {
    filename: 'financial-statement.pdf',
    load: loadFinancialStatementForm,
    View: FinancialStatementView
  },
  '/forms/trial-balance': {
    filename: 'trial-balance.pdf',
    load: loadTrialBalanceForm,
    View: TrialBalanceView
  }
};

function wrapHtml(head, cssCode, bodyHtml) {
  const origin = originFromEnv();
  const cssLinks = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    `${origin}stylesheets/style.css`,
    `${origin}stylesheets/common.css`
  ];
  const links = cssLinks.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');
  const style = cssCode ? `<style>${cssCode}</style>` : '';
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">${links}${head || ''}${style}</head><body>${bodyHtml}</body></html>`;
}

export async function respondFormPdf(event) {
  if (event.url.searchParams.get('format') !== 'pdf') return null;
  const spec = FORMS[event.url.pathname];
  if (!spec) return null;
  if (!event.locals?.user || !event.locals?.tenantId) return null;

  try {
    const term = resolveTerm(event.url, event.locals);
    const props = await spec.load(term, event.locals.tenantId);
    const rendered = spec.View.render(props);
    const fullHTML = wrapHtml(rendered.head, rendered.css?.code, rendered.html);
    const pdf = await htmlToPdf(fullHTML);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${spec.filename}"`
      }
    });
  } catch (e) {
    console.error('respondFormPdf', e);
    return new Response(JSON.stringify({ code: -1, message: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
