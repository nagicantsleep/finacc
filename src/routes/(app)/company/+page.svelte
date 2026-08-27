<script>
  import CompanyView from '$lib/components/company/company.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'company',
    pathname: '/company'
  };
</script>

<svelte:head>
  <title>取引先管理 :: Hieronymus</title>
</svelte:head>

<div class="company-page container-fluid px-0">
  <CompanyView bind:status />
</div>
