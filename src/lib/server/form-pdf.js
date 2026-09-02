import JournalView from '$lib/components/forms/explanatory-journal/explanatory-journal.svelte';
import GeneralLedgerView from '$lib/components/forms/general-ledger/general-ledger.svelte';
import SubsidiaryLedgerView from '$lib/components/forms/subsidiary-ledger/subsidiary-ledger.svelte';
import FinancialStatementView from '$lib/components/forms/financial-statement/financial-statement.svelte';
import TrialBalanceView from '$lib/components/forms/trial-balance/trial-balance.svelte';
import InvoiceView from '$lib/components/forms/invoice/invoice.svelte';
import ReceiptView from '$lib/components/forms/receipt/receipt.svelte';
import EstimateView from '$lib/components/forms/estimate/estimate.svelte';
import { htmlToPdf, originFromEnv } from '$lib/server/print.js';
import {
  loadFinancialStatementForm,
  loadGeneralLedgerForm,
  loadJournalForm,
  loadSubsidiaryLedgerForm,
  loadTrialBalanceForm,
  loadTransactionForm,
  resolveTerm
} from '$lib/server/form-data.js';

const TX_VIEWS = {
  invoice: InvoiceView,
  receipt: ReceiptView,
  estimate: EstimateView
};

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

function wrapHtml(head, cssCode, bodyHtml, extraLinks = []) {
  const origin = originFromEnv();
  const cssLinks = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    `${origin}stylesheets/style.css`,
    `${origin}stylesheets/common.css`,
    ...extraLinks.map((p) => (p.startsWith('http') ? p : `${origin}${p.replace(/^\//, '')}`))
  ];
  const links = cssLinks.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');
  const style = cssCode ? `<style>${cssCode}</style>` : '';
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">${links}${head || ''}${style}</head><body>${bodyHtml}</body></html>`;
}

async function pdfResponse(filename, View, props, extraLinks) {
  const rendered = View.render(props);
  const fullHTML = wrapHtml(rendered.head, rendered.css?.code, rendered.html, extraLinks);
  const pdf = await htmlToPdf(fullHTML);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

export async function respondFormPdf(event) {
  if (event.url.searchParams.get('format') !== 'pdf') return null;
  if (!event.locals?.user || !event.locals?.tenantId) return null;

  const tx = event.url.pathname.match(/^\/forms\/transaction\/(invoice|receipt|estimate)\/(\d+)$/);
  if (tx) {
    try {
      const form = tx[1];
      const id = parseInt(tx[2], 10);
      const props = await loadTransactionForm(id, event.locals.tenantId);
      if (!props) {
        return new Response(JSON.stringify({ code: -1, message: 'not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return await pdfResponse(`${form}.pdf`, TX_VIEWS[form], props, [
        'stylesheets/paperA4.css',
        'stylesheets/transaction.css'
      ]);
    } catch (e) {
      console.error('respondFormPdf transaction', e);
      return new Response(JSON.stringify({ code: -1, message: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const spec = FORMS[event.url.pathname];
  if (!spec) return null;

  try {
    const term = resolveTerm(event.url, event.locals);
    const props = await spec.load(term, event.locals.tenantId);
    return await pdfResponse(spec.filename, spec.View, props);
  } catch (e) {
    console.error('respondFormPdf', e);
    return new Response(JSON.stringify({ code: -1, message: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
