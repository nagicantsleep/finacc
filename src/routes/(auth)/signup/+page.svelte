<script>
  import SignUp from '$lib/components/login/signup.svelte';
  export let form = null;
</script>

<svelte:head>
  <title>新規登録 :: Hieronymus</title>
</svelte:head>

<SignUp {form} />
