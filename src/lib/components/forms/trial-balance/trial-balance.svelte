<FrontCover
  titleKey="trial_balance"
  {company}
  {fy}
  ></FrontCover>
{#if assetPages}
<Print
  {company}
  {fy}
  titleKey="trial_balance"
  sub_title_key="bs_assets"
  pages={assetPages}></Print>
{/if}
{#if liabilitiesAndCapitalPages}
<Print
  {company}
  {fy}
  titleKey="trial_balance"
  sub_title_key="bs_liabilities"
  pages={liabilitiesAndCapitalPages}></Print>
{/if}
{#if incomeStatementPages}
<Print
  {company}
  {fy}
  titleKey="trial_balance"
  sub_title_key="income_statement"
  pages={incomeStatementPages}></Print>
{/if}
<script>
import Print from './print.svelte';
import FrontCover from '../components/front-cover.svelte';

export let company;
export let fy;
export let assetPages;
export let liabilitiesAndCapitalPages;
export let incomeStatementPages;

</script>