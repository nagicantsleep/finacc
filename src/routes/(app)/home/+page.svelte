<script>
  import HomeDashboard from '$lib/components/home/home.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  let alert;
  let alert_level;

  let status = {
    user: data.user || { administrable: true, accounting: true, approvable: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'home',
    pathname: '/home'
  };
</script>

<svelte:head>
  <title>ホーム :: Hieronymus</title>
</svelte:head>

<div class="dashboard-page container-fluid px-0">
  {#if alert}
    <div class="alert alert-{alert_level || 'info'} alert-dismissible fade show" role="alert">
      {alert}
      <button type="button" class="btn-close" on:click={() => alert = null} aria-label="Close"></button>
    </div>
  {/if}

  <HomeDashboard bind:status bind:toast bind:alert bind:alert_level />
  <Toast bind:toast />
</div>
