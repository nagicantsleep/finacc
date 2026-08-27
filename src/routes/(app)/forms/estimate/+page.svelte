<script>
  import View from '$lib/components/forms/estimate/estimate.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant
  };
</script>

<svelte:head>
  <title>御見積書 :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View bind:status />
</div>
