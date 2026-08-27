<FrontCover
  title="ledger"
  {fy}
  {company}
  ></FrontCover>
{#if accountPages}
<AccountPage
  titleKey="ledger"
  {fy}
  {company}
  {accountPages}
  ></AccountPage>
{#each ledgerPages as ledgerPage}
<LedgerPage
  {fy}
  {company}
  titleKey="ledger"
  {ledgerPage}
  ></LedgerPage>
{/each}
{/if}
<script>
import AccountPage from '../components/account-page.svelte';
import FrontCover from '../components/front-cover.svelte';
import LedgerPage from '../components/ledger-page.svelte';
import BilingualText from '$lib/components/BilingualText.svelte';

export let fy;
export let company;
export let accountPages;
export let ledgerPages;

</script>
