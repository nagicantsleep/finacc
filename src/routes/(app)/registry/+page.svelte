<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import View from '$lib/components/registry/registry.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant
  };
</script>

<svelte:head>
  <title>{$bi('title_registry')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View bind:status initialData={data} />
</div>
