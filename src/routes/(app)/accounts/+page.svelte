<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import AccountsView from '$lib/components/accounts/accounts.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'accounts',
    pathname: '/accounts',
    state: 'list'
  };
</script>

<svelte:head>
  <title>{$bi('title_accounts')} :: Hieronymus</title>
</svelte:head>

<div class="accounts-page container-fluid px-0">
  <AccountsView bind:status initialAccounts={data.accounts} />
</div>
