import Accounts from '$lib/server/accounts.js';

export function parseLanguagePair(url, locals) {
  const q = url.searchParams.get('languagePair');
  if (q) {
    try {
      return JSON.parse(q);
    } catch {
      /* ignore */
    }
  }
  return locals.user?.languagePair || null;
}

export async function accountsVariant(kind, tenantId, term, languagePair) {
  if (kind === 'all2') return Accounts.all2(tenantId, term, languagePair);
  if (kind === 'all3') return Accounts.all3(tenantId, term, languagePair);
  return Accounts.all4(tenantId, term, languagePair);
}
