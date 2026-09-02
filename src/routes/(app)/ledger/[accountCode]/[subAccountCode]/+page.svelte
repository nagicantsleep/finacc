<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import Ledger from '$lib/components/ledger/ledger.svelte';
  export let data;
</script>

<svelte:head>
  <title>{$bi('title_ledger')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <Ledger
    status={{ user: data.user, fy: data.currentFy }}
    accounts={data.accounts}
    account={data.account}
    remaining={data.remaining}
    details={data.details}
    accountCode={data.accountCode}
    subAccountCode={data.subAccountCode}
  />
</div>
