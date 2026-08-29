<script>
  import TenantDashboard from '$lib/components/tenant/tenant.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  let status = {
    user: data.user || { administrable: true, accounting: true, tenantSettings: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'tenant',
    pathname: '/tenant'
  };
</script>

<svelte:head>
  <title>会社設定 :: Hieronymus</title>
</svelte:head>

<div class="tenant-page container-fluid px-0">
  <TenantDashboard bind:status bind:toast />
  <Toast bind:toast />
</div>
