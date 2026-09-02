<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import SignUp from '$lib/components/login/signup.svelte';
  export let form = null;
</script>

<svelte:head>
  <title>{$bi('title_signup')} :: Hieronymus</title>
</svelte:head>

<SignUp {form} />
