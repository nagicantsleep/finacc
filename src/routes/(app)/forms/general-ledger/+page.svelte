<script>
  import View from '$lib/components/forms/general-ledger/general-ledger.svelte';

  export let data;

  $: fy = data.fy || { term: 1, year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' };
  $: company = data.company || { name: data.tenant?.name || 'Hieronymus Corp', zip: '100-0001', address1: '東京都千代田区千代田1-1' };
  $: accountPages = data.accountPages || [];
  $: ledgerPages = data.ledgerPages || [];
</script>

<svelte:head>
  <title>総勘定元帳帳票 :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View {fy} {company} {accountPages} {ledgerPages} />
</div>
