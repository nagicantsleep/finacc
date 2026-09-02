<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import Journal from '$lib/components/journal/journal.svelte';
  export let data;
</script>

<svelte:head>
  <title>{$bi('title_journal')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <Journal
    status={{ user: data.user, fy: data.currentFy }}
    journal={data.journal}
    accounts={data.accounts}
    dates={data.dates}
    year={data.year}
    month={data.month}
  />
</div>
