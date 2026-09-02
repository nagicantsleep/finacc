<script>
  import { getStores } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import { GENERIC_ERROR_MESSAGE, NOT_FOUND_MESSAGE } from '$lib/errors.js';

  export let status = 500;
  export let error = null;

  let code = typeof error?.status === 'number' ? error.status : status;
  let message = error?.message || GENERIC_ERROR_MESSAGE;
  if (message === NOT_FOUND_MESSAGE) code = 404;

  let unsub = () => {};
  try {
    const { page } = getStores();
    unsub = page.subscribe((p) => {
      if (!p) return;
      if (typeof p.status === 'number') code = p.status;
      if (p.error?.message) message = p.error.message;
    });
  } catch {
    // no request store context (some SSR error paths)
  }

  onDestroy(unsub);
</script>

<svelte:head>
  <title>Error {code} :: Hieronymus</title>
</svelte:head>

<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <img src="/logo.png" alt="Logo" class="pe-1" />Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body text-center">
        <p class="fs-1 fw-semibold mb-2">{code}</p>
        <p class="text-muted mb-4">{message}</p>
        <a href={resolve('/workspace')} class="btn btn-primary">ホームに戻る</a>
      </div>
    </div>
  </div>
</div>
