{#if assetPages}
<TrialBalance
  {fy}
  {company}
  {assetPages}
  {liabilitiesAndCapitalPages}
  {incomeStatementPages}
  ></TrialBalance>
{:else}
  <p><BilingualText key="loading" /></p>
{/if}
<script>
import { onMount } from 'svelte';
import myCompany from '../../../../libs/my-company.js';
import initializeTrialBalance from '../../../../libs/init-trial-balance.js';

import TrialBalance from './trial-balance.svelte';

import BilingualText from '../../components/bilingual-text.svelte';
export let term;

let fy;
let company;
let assetPages;
let liabilitiesAndCapitalPages;
let incomeStatementPages;

onMount(async () => {
  company = await myCompany();
  ({fy, assetPages, liabilitiesAndCapitalPages, incomeStatementPages} = await initializeTrialBalance(term));
})

</script>