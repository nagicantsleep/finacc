<script>
  import TrialBalanceView from '$lib/components/reports/trial-balance.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true, fiscal_browsing: true },
    fy: data.currentFy || { term: data.term, startDate: `${data.termYear || 2026}-01-01`, endDate: `${data.termYear || 2026}-12-31` },
    tenant: data.tenant,
    current: 'trial-balance',
    pathname: '/reports/trial-balance'
  };
</script>

<svelte:head>
  <title>残高試算表 v2 :: Hieronymus</title>
</svelte:head>

<div class="trial-balance-page container-fluid px-0">
  <TrialBalanceView bind:status />
</div>
