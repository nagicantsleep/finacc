<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import View from '$lib/components/forms/explanatory-journal/explanatory-journal.svelte';

  export let data;

  $: fy = data.fy || { term: 1, year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' };
  $: company = data.company || { name: data.tenant?.name || 'Hieronymus Corp', zip: '100-0001', address1: '東京都千代田区千代田1-1' };
  $: dates = data.dates || [];
</script>

<svelte:head>
  <title>{$bi('title_explanatory_journal_form')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View {fy} {company} {dates} />
</div>
