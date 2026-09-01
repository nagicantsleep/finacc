<script>
  import TenantDashboard from '$lib/components/tenant/tenant.svelte';
  import Toast from '$lib/components/common/Toast.svelte';
  import { bi } from '$lib/i18n/bilingual.js';

  export let data;

  let toast;
  let status = {
    user: data.user || { administrable: true, accounting: true, tenantSettings: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'tenant',
    pathname: '/tenant'
  };

  $: pageTitle = `${$bi('tenant_settings')} :: Hieronymus`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div class="tenant-page container-fluid px-0">
  <TenantDashboard
    bind:status
    bind:toast
    companyClasses={data.companyClasses}
    transactionKinds={data.transactionKinds}
    voucherClasses={data.voucherClasses}
    itemClasses={data.itemClasses}
    taxRules={data.taxRules}
    companyInfo={data.company}
    backupDates={data.backupDates}
  />
  <Toast bind:toast />
</div>
