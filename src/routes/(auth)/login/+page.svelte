<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import Login from '$lib/components/login/login.svelte';

  export let form = null;
  export let data;
</script>

<svelte:head>
  <title>{$bi('title_login')} :: Hieronymus</title>
</svelte:head>

<Login {form} registered={data?.registered} />
