import { redirect } from '@sveltejs/kit';

const CANONICAL = {
  explanatory_journal: '/forms/explanatory-journal',
  'general_ledger': '/forms/general-ledger',
  subsidiary_ledger: '/forms/subsidiary-ledger',
  trial_balance: '/forms/trial-balance',
  financial_statement: '/forms/financial-statement',
  'explanatory-journal': '/forms/explanatory-journal',
  'general-ledger': '/forms/general-ledger',
  'subsidiary-ledger': '/forms/subsidiary-ledger',
  'financial-statement': '/forms/financial-statement'
};

/** Redirect underscore/hyphen form URLs that include a fiscal term to the SK page. */
export function redirectFormTerm(slug) {
  const dest = CANONICAL[slug];
  if (!dest) throw new Error(`Unknown form slug: ${slug}`);
  return ({ params, url }) => {
    const next = new URL(dest, url.origin);
    url.searchParams.forEach((v, k) => next.searchParams.set(k, v));
    if (params.term) next.searchParams.set('term', params.term);
    throw redirect(307, `${next.pathname}${next.search}`);
  };
}
