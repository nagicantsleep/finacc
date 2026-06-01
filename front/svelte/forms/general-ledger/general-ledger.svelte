<FrontCover
  title="ledger"
  {fy}
  {company}
  ></FrontCover>
{#if accountPages}
<AccountPage
  title="ledger"
  {fy}
  {company}
  {accountPages}
  ></AccountPage>
{#each ledgerPages as ledgerPage}
<LedgerPage
  {fy}
  {company}
  title="ledger"
  {ledgerPage}
  ></LedgerPage>
{/each}
{/if}
<script>
import AccountPage from '../components/account-page.svelte';
import FrontCover from '../components/front-cover.svelte';
import LedgerPage from '../components/ledger-page.svelte';
import BilingualText from '../../components/bilingual-text.svelte';

export let fy;
export let company;
export let accountPages;
export let ledgerPages;

</script>
