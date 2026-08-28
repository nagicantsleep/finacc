<script>
  import MenuView from '$lib/components/menu/menu.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'menu',
    pathname: '/menu'
  };
</script>

<svelte:head>
  <title>メニュー :: Hieronymus</title>
</svelte:head>

<div class="menu-page container-fluid px-0">
  <MenuView bind:status bind:toast />
  <Toast bind:toast />
</div>
