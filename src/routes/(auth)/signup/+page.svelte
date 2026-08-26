<script>
  import { enhance } from '$app/forms';

  export let form;
  let isSubmitting = false;
</script>

<svelte:head>
  <title>新規登録 :: Hieronymus</title>
</svelte:head>

<div class="signup-page d-flex justify-content-center align-items-center min-vh-100 bg-light">
  <div class="signup-box" style="width: 440px; max-width: 90%;">
    <div class="signup-logo text-center mb-3 fs-3 fw-bold">
      <img src="/public/logo.png" alt="Logo" class="pe-1" style="height: 36px;" /> Hieronymus
    </div>
    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="text-center mb-3">新規登録 / Sign Up</h4>

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
              placeholder="ログイン用ユーザー名"
              required
            />
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">メールアドレス / Email</label>
            <input
              id="email"
              name="email"
              type="email"
              class="form-control"
              value={form?.email ?? ''}
              placeholder="example@company.com"
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
              placeholder="パスワード"
              required
            />
          </div>

          <div class="mb-3">
            <label for="legalName" class="form-label">氏名 / Legal Name</label>
            <input
              id="legalName"
              name="legalName"
              type="text"
              class="form-control"
              value={form?.legalName ?? ''}
              placeholder="氏名（本名）"
              required
            />
          </div>

          <div class="mb-3">
            <label for="tenantName" class="form-label">会社名・組織名 / Organization Name</label>
            <input
              id="tenantName"
              name="tenantName"
              type="text"
              class="form-control"
              value={form?.tenantName ?? ''}
              placeholder="会社名または屋号"
            />
          </div>

          <div class="d-grid gap-2 mt-4">
            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              {/if}
              アカウントを作成する
            </button>
            <a href="/login" class="text-center text-decoration-none mt-2">
              既にアカウントをお持ちの方はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
