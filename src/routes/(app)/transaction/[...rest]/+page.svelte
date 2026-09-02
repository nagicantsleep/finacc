<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import TransactionView from '$lib/components/transaction/transaction.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'transaction',
    pathname: '/transaction',
    state: data.viewState || 'list'
  };
</script>

<svelte:head>
  <title>{$bi('title_transaction')} :: Hieronymus</title>
</svelte:head>

<div class="transaction-page container-fluid px-0">
  <TransactionView
    bind:status
    transactions={data.transactions}
    selectedTransaction={data.selectedTransaction}
    transactionKinds={data.transactionKinds}
    users={data.users}
    viewState={data.viewState}
    filters={data.filters}
  />
</div>
