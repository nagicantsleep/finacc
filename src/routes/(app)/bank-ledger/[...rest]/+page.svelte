<script>
  import BankLedger from '$lib/components/bank-ledger/bank-ledger.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'bank-ledger',
    pathname: '/bank-ledger'
  };
</script>

<svelte:head>
  <title>預金出納帳 :: Hieronymus</title>
</svelte:head>

<div class="bank-ledger-page container-fluid px-0">
  <BankLedger {status} initialData={data} />
</div>
