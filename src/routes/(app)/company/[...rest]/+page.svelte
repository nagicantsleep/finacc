<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import CompanyView from '$lib/components/company/company.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'company',
    pathname: '/company',
    state: data.viewState || 'list'
  };
</script>

<svelte:head>
  <title>{$bi('title_company')} :: Hieronymus</title>
</svelte:head>

<div class="company-page container-fluid px-0">
  <CompanyView
    bind:status
    companies={data.companies}
    companyClasses={data.companyClasses}
    selectedCompany={data.selectedCompany}
    viewState={data.viewState}
    kind={data.kind}
  />
</div>
