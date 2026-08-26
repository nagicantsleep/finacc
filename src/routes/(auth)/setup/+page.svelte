<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let isSubmitting = false;
</script>

<svelte:head>
  <title>初期設定ウィザード :: Hieronymus</title>
</svelte:head>

<div class="setup-page d-flex justify-content-center align-items-center min-vh-100 bg-light py-5">
  <div class="card shadow-sm border-0" style="width: 580px; max-width: 95%;">
    <div class="card-body p-4 p-md-5">
      <div class="text-center mb-4">
        <img src="/public/logo.png" alt="Logo" style="height: 42px;" class="mb-2" />
        <h3 class="fw-bold">初期設定ウィザード</h3>
        <p class="text-muted">会計基準と勘定科目の初期セットアップを行います</p>
      </div>

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
        <div class="mb-4">
          <h5 class="border-bottom pb-2 mb-3">1. 会計期間の設定</h5>
          <div class="row g-3">
            <div class="col-6">
              <label for="startDate" class="form-label">期首日（開始日）</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                class="form-control"
                value={data.defaultStartDate}
                required
              />
            </div>
            <div class="col-6">
              <label for="endDate" class="form-label">期末日（終了日）</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                class="form-control"
                value={data.defaultEndDate}
                required
              />
            </div>
            <div class="col-6">
              <label for="term" class="form-label">会計期（期数）</label>
              <input
                id="term"
                name="term"
                type="number"
                class="form-control"
                value={data.defaultTerm}
                min="1"
                required
              />
            </div>
            <div class="col-6">
              <label for="year" class="form-label">年度（西暦）</label>
              <input
                id="year"
                name="year"
                type="number"
                class="form-control"
                value={data.defaultYear}
                required
              />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <h5 class="border-bottom pb-2 mb-3">2. 事業形態と勘定科目</h5>
          <div class="mb-3">
            <label for="companyClass" class="form-label">事業形態</label>
            <select id="companyClass" name="companyClass" class="form-select" required>
              <option value="1" selected>法人（法人用勘定科目テンプレート）</option>
              <option value="2">個人事業主（個人事業主用勘定科目テンプレート）</option>
            </select>
          </div>

          <div class="mb-3">
            <label for="roundingMethod" class="form-label">端数処理方法（消費税等）</label>
            <select id="roundingMethod" name="roundingMethod" class="form-select" required>
              <option value="1" selected>切り捨て (Floor)</option>
              <option value="2">四捨五入 (Round)</option>
              <option value="3">切り上げ (Ceil)</option>
            </select>
          </div>
        </div>

        <div class="d-grid gap-2 mt-4">
          <button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            {/if}
            初期設定を完了して開始する
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
