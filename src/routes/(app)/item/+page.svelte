<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let showModal = false;
  let isSubmitting = false;
</script>

<svelte:head>
  <title>品目マスタ :: Hieronymus</title>
</svelte:head>

<div class="container-fluid">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <h3 class="fw-bold mb-0">品目マスタ (Item Catalog)</h3>
    <button class="btn btn-primary btn-sm" on:click={() => (showModal = true)}>+ 新規品目登録</button>
  </div>

  {#if form?.error}
    <div class="alert alert-danger" role="alert">
      {form.error}
    </div>
  {/if}

  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 20%;">品目コード</th>
              <th style="width: 40%;">品目名</th>
              <th style="width: 20%;" class="text-end">単価</th>
              <th style="width: 20%;">単位</th>
            </tr>
          </thead>
          <tbody>
            {#if data.items.length === 0}
              <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                  登録された品目はありません。
                </td>
              </tr>
            {:else}
              {#each data.items as item}
                <tr>
                  <td class="font-monospace fw-bold">{item.code}</td>
                  <td class="fw-semibold">{item.name}</td>
                  <td class="text-end font-monospace">¥{item.price.toLocaleString('ja-JP')}</td>
                  <td>{item.unit}</td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {#if showModal}
    <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">新規品目登録</h5>
            <button type="button" class="btn-close" on:click={() => (showModal = false)}></button>
          </div>
          <form
            action="?/create"
            method="POST"
            use:enhance={() => {
              isSubmitting = true;
              return async ({ update }) => {
                isSubmitting = false;
                showModal = false;
                await update();
              };
            }}
          >
            <div class="modal-body">
              <div class="mb-3">
                <label for="itemCode" class="form-label">品目コード</label>
                <input id="itemCode" name="code" type="number" class="form-control" placeholder="1001" required />
              </div>
              <div class="mb-3">
                <label for="itemName" class="form-label">品目名</label>
                <input id="itemName" name="name" type="text" class="form-control" placeholder="品目名称" required />
              </div>
              <div class="mb-3">
                <label for="itemPrice" class="form-label">基準単価</label>
                <input id="itemPrice" name="price" type="number" class="form-control" placeholder="0" min="0" />
              </div>
              <div class="mb-3">
                <label for="itemUnit" class="form-label">単位</label>
                <input id="itemUnit" name="unit" type="text" class="form-control" placeholder="個, 式, 月" value="個" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" on:click={() => (showModal = false)}>
                キャンセル
              </button>
              <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2"></span>
                {/if}
                登録する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}
</div>
