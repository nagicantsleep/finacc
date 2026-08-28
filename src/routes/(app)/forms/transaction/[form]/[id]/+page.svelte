<script>
  import Invoice from '$lib/components/forms/invoice/invoice.svelte';
  import Receipt from '$lib/components/forms/receipt/receipt.svelte';
  import Estimate from '$lib/components/forms/estimate/estimate.svelte';

  export let data;

  $: transaction = data.transaction;
  $: company = data.company;
</script>

<svelte:head>
  <title>{data.form} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  {#if data.form === 'invoice'}
    <Invoice {transaction} {company} />
  {:else if data.form === 'receipt'}
    <Receipt {transaction} {company} />
  {:else}
    <Estimate {transaction} {company} />
  {/if}
</div>
