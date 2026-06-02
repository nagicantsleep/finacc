<script>
import { onMount } from 'svelte';
import InvoiceView from './invoice.svelte';
import myCompany from '../../../../libs/my-company.js';

import BilingualText from '../../components/bilingual-text.svelte';
export let id;

console.log('params:', id);

let transaction;
let company;
  
onMount(async () => {
  const res = await fetch(`/api/transaction/${id}`);
  const data = await res.json();
  transaction = data.transaction;
  company = await myCompany();
  console.log(company)
});
</script>
  
{#if transaction && company}
  <InvoiceView {transaction} {company} />
{:else}
  <p><BilingualText key="loading" /></p>
{/if}
  