<script>
  import Logon from '$lib/components/logon.svelte';
  import { bi } from '$lib/i18n/bilingual.js';

  $: pageTitle = `${$bi('logon_title')} :: Hieronymus`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Logon />
