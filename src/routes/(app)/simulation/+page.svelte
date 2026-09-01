<script>
  import View from '$lib/components/simulation/scenarios.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant
  };
</script>

<svelte:head>
  <title>シミュレーション :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View bind:status initialData={data} />
</div>
