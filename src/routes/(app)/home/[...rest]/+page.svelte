<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import HomeView from '$lib/components/home/home.svelte';
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
  <title>{$bi('title_home')} :: Hieronymus</title>
</svelte:head>

<div class="home-page container-fluid px-0">
  <HomeView
    bind:status
    bind:toast
    bind:alert
    bind:alert_level
    initialCompany={data.company}
    fiscalYears={data.fiscalYears}
    pendingSlips={data.pendingSlips}
    accounts={data.accounts}
    backupDates={data.backupDates}
    maintenance={data.maintenance}
  />
  <Toast bind:toast />
</div>
