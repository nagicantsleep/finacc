<script>
  import ItemView from '$lib/components/item/item.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'item',
    pathname: '/item'
  };
</script>

<svelte:head>
  <title>品目マスタ :: Hieronymus</title>
</svelte:head>

<div class="item-page container-fluid px-0">
  <ItemView bind:status initialData={data} />
</div>
