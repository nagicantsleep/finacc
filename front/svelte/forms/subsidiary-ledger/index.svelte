{#if ledgerPages}
<SubsidiaryLedger
  {company}
  {fy}
  {ledgerPages}
  ></SubsidiaryLedger>
{:else}
<p><BilingualText key="loading" /></p>
{/if}

<script>
import { onMount } from 'svelte';
import SubsidiaryLedger from './subsidiary-ledger.svelte';
import myCompany from '../../../../libs/my-company.js';
import initializeSubsidiaryLedger from '../../../../libs/init-subsidiary-ledger.js';

import BilingualText from '../../components/bilingual-text.svelte';
export let term;

let fy;
let company;
let ledgerPages;

onMount(async () => {
  company = await myCompany();
  ({fy, ledgerPages} = await initializeSubsidiaryLedger(term));
  console.log({ledgerPages});
});
</script>