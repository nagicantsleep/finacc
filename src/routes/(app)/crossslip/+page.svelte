<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let isSubmitting = false;
</script>

<svelte:head>
  <title>振替伝票入力 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <h3 class="fw-bold mb-0">振替伝票入力</h3>
    <a href="/home" class="btn btn-outline-secondary btn-sm">ホームに戻る</a>
  </div>

  {#if form?.success}
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      振替伝票が正常に登録されました！
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-danger" role="alert">
      {form.error}
    </div>
  {/if}

  <div class="card shadow-sm border-0">
    <div class="card-body p-4">
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
        <div class="row g-3 mb-4">
          <div class="col-md-2">
            <label for="year" class="form-label">年</label>
            <input id="year" name="year" type="number" class="form-control" value={data.defaultDate.year} required />
          </div>
          <div class="col-md-2">
            <label for="month" class="form-label">月</label>
            <input id="month" name="month" type="number" class="form-control" value={data.defaultDate.month} min="1" max="12" required />
          </div>
          <div class="col-md-2">
            <label for="day" class="form-label">日</label>
            <input id="day" name="day" type="number" class="form-control" value={data.defaultDate.day} min="1" max="31" required />
          </div>
        </div>

        <div class="table-responsive mb-4">
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 25%;">借方勘定科目 (Debit)</th>
                <th style="width: 25%;">貸方勘定科目 (Credit)</th>
                <th style="width: 20%;">金額 (Amount)</th>
                <th style="width: 30%;">摘要 (Memo)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <select name="debitAccount" class="form-select" required>
                    <option value="">-- 借方科目を選択 --</option>
                    {#each data.accounts as acc}
                      <option value={acc.id}>{acc.code} : {acc.name}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <select name="creditAccount" class="form-select" required>
                    <option value="">-- 貸方科目を選択 --</option>
                    {#each data.accounts as acc}
                      <option value={acc.id}>{acc.code} : {acc.name}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <input name="amount" type="number" class="form-control text-end" placeholder="0" min="1" required />
                </td>
                <td>
                  <input name="application" type="text" class="form-control" placeholder="摘要・備考を入力" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="reset" class="btn btn-secondary">クリア</button>
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            {/if}
            伝票を登録する
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
