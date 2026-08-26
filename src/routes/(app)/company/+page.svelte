<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let showModal = false;
  let isSubmitting = false;
</script>

<svelte:head>
  <title>取引先管理 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <h3 class="fw-bold mb-0">取引先管理 (Company / Partners)</h3>
    <div class="d-flex gap-2">
      <button class="btn btn-primary btn-sm" on:click={() => (showModal = true)}>+ 新規取引先登録</button>
      <a href="/home" class="btn btn-outline-secondary btn-sm">ホームに戻る</a>
    </div>
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
              <th style="width: 15%;">コード</th>
              <th style="width: 35%;">取引先名</th>
              <th style="width: 30%;">正式名称</th>
              <th style="width: 20%;">取引先区分</th>
            </tr>
          </thead>
          <tbody>
            {#each data.companies as comp}
              <tr>
                <td class="font-monospace fw-bold">{comp.code}</td>
                <td class="fw-semibold">{comp.name}</td>
                <td>{comp.officialName}</td>
                <td><span class="badge bg-secondary">{comp.className}</span></td>
              </tr>
            {/each}
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
            <h5 class="modal-title">新規取引先登録</h5>
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
                <label for="compCode" class="form-label">コード</label>
                <input id="compCode" name="code" type="number" class="form-control" placeholder="1001" required />
              </div>
              <div class="mb-3">
                <label for="compName" class="form-label">取引先名 (略称)</label>
                <input id="compName" name="name" type="text" class="form-control" placeholder="取引先名" required />
              </div>
              <div class="mb-3">
                <label for="compOfficialName" class="form-label">正式名称</label>
                <input id="compOfficialName" name="officialName" type="text" class="form-control" placeholder="株式会社〇〇" />
              </div>
              <div class="mb-3">
                <label for="compClass" class="form-label">取引先区分</label>
                <select id="compClass" name="companyClassId" class="form-select" required>
                  {#each data.companyClasses as cls}
                    <option value={cls.id}>{cls.name}</option>
                  {/each}
                </select>
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
