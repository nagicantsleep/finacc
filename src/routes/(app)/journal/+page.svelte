<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import JournalView from '$lib/components/journal/journal.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'journal',
    pathname: '/journal'
  };
</script>

<svelte:head>
  <title>{$bi('title_journal')} :: Hieronymus</title>
</svelte:head>

<div class="journal-page container-fluid px-0">
  <JournalView bind:status />
</div>
