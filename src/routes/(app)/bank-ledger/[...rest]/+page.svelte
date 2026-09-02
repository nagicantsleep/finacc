<script>
  import { bi } from '$lib/i18n/bilingual.js';
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
  <title>{$bi('title_bank_ledger')} :: Hieronymus</title>
</svelte:head>

<div class="bank-ledger-page container-fluid px-0">
  <BankLedger {status} initialData={data} />
</div>
