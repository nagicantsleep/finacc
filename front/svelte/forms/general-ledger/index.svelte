{#if ledgerPages}
<GeneralLedger
  {company}
  {fy}
  {accountPages}
  {ledgerPages}
  ></GeneralLedger>
{:else}
<p><BilingualText key="loading" /></p>
{/if}

<script>
import { onMount } from 'svelte';
import GeneralLedger from './general-ledger.svelte';
import myCompany from '../../../../libs/my-company.js';
import initializeGeneralLedger from '../../../../libs/init-general-ledger.js';

import BilingualText from '../../components/bilingual-text.svelte';
export let term;

let fy;
let company;
let ledgerPages;
let accountPages;

onMount(async () => {
  company = await myCompany();
  ({fy, accountPages, ledgerPages} = await initializeGeneralLedger(term));
  console.log({accountPages},{ledgerPages});
});
</script>