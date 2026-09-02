<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import LedgerView from '$lib/components/ledger/ledger.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'ledger',
    pathname: '/ledger'
  };
</script>

<svelte:head>
  <title>{$bi('title_ledger')} :: Hieronymus</title>
</svelte:head>

<div class="ledger-page container-fluid px-0">
  <LedgerView bind:status />
</div>
