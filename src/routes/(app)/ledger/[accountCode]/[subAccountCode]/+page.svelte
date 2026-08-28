<script>
  import Ledger from '$lib/components/ledger/ledger.svelte';
  export let data;
</script>

<svelte:head>
  <title>総勘定元帳 :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <Ledger status={{ user: data.user, fy: data.currentFy }} />
</div>
