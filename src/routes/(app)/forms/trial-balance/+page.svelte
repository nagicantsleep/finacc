<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import View from '$lib/components/forms/trial-balance/trial-balance.svelte';

  export let data;
</script>

<svelte:head>
  <title>{$bi('title_trial_balance_form')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View
    fy={data.fy}
    company={data.company}
    assetPages={data.assetPages}
    liabilitiesAndCapitalPages={data.liabilitiesAndCapitalPages}
    incomeStatementPages={data.incomeStatementPages}
  />
</div>
