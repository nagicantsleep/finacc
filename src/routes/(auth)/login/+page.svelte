<script>
  import Login from '$lib/components/login/login.svelte';

  export let form = null;
  export let data;
</script>

<svelte:head>
  <title>ログイン :: Hieronymus</title>
</svelte:head>

<Login {form} registered={data?.registered} />
