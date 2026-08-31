<script>
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Error {$page.status} :: Hieronymus</title>
</svelte:head>

<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <img src="/logo.png" alt="Logo" class="pe-1" />Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body text-center">
        <p class="fs-1 fw-semibold mb-2">{$page.status}</p>
        <p class="text-muted mb-4">{$page.error?.message || 'エラーが発生しました。'}</p>
        <a href={resolve('/workspace')} class="btn btn-primary">ホームに戻る</a>
      </div>
    </div>
  </div>
</div>
