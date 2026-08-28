<script>
  import { goto } from '$app/navigation';
  import Login from '$lib/components/login/login.svelte';

  let current = 'login';

  $: if (current === 'signup') {
    goto('/signup');
  }
</script>

<svelte:head>
  <title>ログイン :: Hieronymus</title>
</svelte:head>

<Login bind:current />
