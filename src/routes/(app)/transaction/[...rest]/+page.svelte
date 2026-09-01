<script>
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
  <title>取引管理 :: Hieronymus</title>
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
