<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let showCreateModal = false;
  let isSubmitting = false;
</script>

<svelte:head>
  <title>テナント選択 :: Hieronymus</title>
</svelte:head>

<div class="logon-page min-vh-100 bg-light py-5">
  <div class="container" style="max-width: 680px;">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center">
        <img src="/logo.png" alt="Logo" style="height: 36px;" class="pe-2" />
        <h4 class="mb-0 fw-bold">テナント（組織）の選択</h4>
      </div>
      <form action="?/logout" method="POST">
        <button type="submit" class="btn btn-outline-secondary btn-sm">ログアウト</button>
      </form>
    </div>

    {#if form?.error}
      <div class="alert alert-danger py-2 mb-4" role="alert">
        {form.error}
      </div>
    {/if}

    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body p-4">
        <p class="text-muted mb-3">
          ようこそ <strong>{data.user?.name}</strong> さん。操作するテナントを選択してください。
        </p>

        {#if data.memberships.length === 0}
          <div class="text-center py-4">
            <p class="text-muted mb-3">所属しているテナントがありません。</p>
            <button class="btn btn-primary" on:click={() => (showCreateModal = true)}>
              新しいテナントを作成
            </button>
          </div>
        {:else}
          <div class="list-group mb-3">
            {#each data.memberships as m}
              <form action="?/selectTenant" method="POST" class="w-100">
                <input type="hidden" name="tenantId" value={m.tenantId} />
                <button
                  type="submit"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 border-start-0 border-end-0"
                  class:bg-primary-subtle={m.tenantId === data.currentTenantId}
                >
                  <div>
                    <h6 class="mb-1 fw-bold text-dark">{m.name}</h6>
                    <small class="text-muted">Slug: {m.slug} | ロール: {m.role}</small>
                  </div>
                  <div>
                    {#if m.isDefault}
                      <span class="badge bg-secondary me-2">デフォルト</span>
                    {/if}
                    <span class="btn btn-sm btn-outline-primary">選択</span>
                  </div>
                </button>
              </form>
            {/each}
          </div>

          <div class="d-flex justify-content-end mt-3">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              on:click={() => (showCreateModal = true)}
            >
              + 新しいテナントを追加作成
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if showCreateModal}
      <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">新しいテナント（会社・組織）の作成</h5>
              <button
                type="button"
                class="btn-close"
                on:click={() => (showCreateModal = false)}
              ></button>
            </div>
            <form
              action="?/createTenant"
              method="POST"
              use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                  isSubmitting = false;
                  await update();
                };
              }}
            >
              <div class="modal-body">
                <div class="mb-3">
                  <label for="tenantNameInput" class="form-label">会社名・組織名</label>
                  <input
                    id="tenantNameInput"
                    name="name"
                    type="text"
                    class="form-control"
                    placeholder="株式会社〇〇 または 屋号"
                    required
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  on:click={() => (showCreateModal = false)}
                >
                  キャンセル
                </button>
                <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                  {#if isSubmitting}
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {/if}
                  作成して初期設定へ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
