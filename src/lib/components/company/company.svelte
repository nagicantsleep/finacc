{#if viewState === 'list'}
<CompanyList
  companies={companies}
  companyClasses={companyClasses}
  kind={kind}
  on:open={openEntry}></CompanyList>
{:else if viewState === 'home'}
<CompanyHome
  bind:status={status}
></CompanyHome>
{:else if (viewState === 'entry' && company && company.id) || (viewState === 'new')}
<CompanyEntry
  bind:status={status}
  bind:company={company}
  companyClasses={companyClasses}
  on:close={closeEntry}></CompanyEntry>
{/if}

<style>
</style>

<script>
import { invalidate } from '$app/navigation';
import CompanyEntry from './company-entry.svelte';
import CompanyList from './company-list.svelte';
import CompanyHome from './company-home.svelte';
import { currentCompany } from '$lib/client/current-record.js';
import { link } from '$lib/client/router.js';

export let status;
export let companies = [];
export let companyClasses = [];
export let selectedCompany = null;
export let viewState = 'list';
export let kind = -1;

let company = selectedCompany || {};

$: company = selectedCompany || {};
$: if (status) status.state = viewState;

const openEntry = (event) => {
  const company_data = event.detail;
  if (!company_data || !company_data.id) {
    link('/company/new');
  } else {
    currentCompany.set(company_data);
    link(`/company/entry/${company_data.id}`);
  }
};

const closeEntry = () => {
  currentCompany.set(null);
  invalidate('app:company');
};
</script>
