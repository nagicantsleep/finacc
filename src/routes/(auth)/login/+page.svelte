<script>
  import { enhance } from '$app/forms';

  export let form;
  let isSubmitting = false;
</script>

<svelte:head>
  <title>ログイン :: Hieronymus</title>
</svelte:head>

<div class="login-page d-flex justify-content-center align-items-center min-vh-100 bg-light">
  <div class="login-box" style="width: 400px; max-width: 90%;">
    <div class="login-logo text-center mb-3 fs-3 fw-bold">
      <img src="/public/logo.png" alt="Logo" class="pe-1" style="height: 36px;" /> Hieronymus
    </div>
    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="text-center mb-3">ログイン / Login</h4>

        {#if form?.error}
          <div class="alert alert-danger py-2 text-center" role="alert">
            {form.error}
          </div>
        {/if}

        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              isSubmitting = false;
              await update();
            };
          }}
        >
          <div class="mb-3">
            <label for="username" class="form-label">ユーザー名 / Username</label>
            <input
              id="username"
              name="username"
              type="text"
              class="form-control"
              value={form?.username ?? ''}
              placeholder="ユーザー名を入力"
              required
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">パスワード / Password</label>
            <input
              id="password"
              name="password"
              type="password"
              class="form-control"
              placeholder="パスワードを入力"
              required
            />
          </div>

          <div class="d-grid gap-2 mt-4">
            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              {/if}
              ログイン
            </button>
            <a href="/signup" class="text-center text-decoration-none mt-2">
              新規アカウント作成はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
