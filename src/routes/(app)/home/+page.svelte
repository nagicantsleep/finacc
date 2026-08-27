<script>
  export let data;
</script>

<svelte:head>
  <title>ダッシュボード :: Hieronymus</title>
</svelte:head>

<div class="dashboard-page">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h3 class="fw-bold mb-1">ダッシュボード</h3>
      <span class="text-muted small">
        会計期間: {new Date(data.currentFy.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(data.currentFy.endDate).toLocaleDateString('ja-JP')}
      </span>
    </div>
  </div>

  <div class="row g-4">
    <!-- Quick Navigation Cards -->
    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="p-2 bg-primary-subtle text-primary rounded me-3 fs-4">
              <i class="bi bi-journal-bookmark"></i>
            </div>
            <h5 class="card-title fw-bold mb-0">伝票・日常業務</h5>
          </div>
          <div class="list-group list-group-flush">
            <a href="/crossslip" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-journal-plus me-2 text-primary"></i> 振替伝票入力</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/journal" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-journal-text me-2 text-primary"></i> 仕訳日記帳</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/ledger" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-book me-2 text-primary"></i> 総勘定元帳</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="p-2 bg-success-subtle text-success rounded me-3 fs-4">
              <i class="bi bi-pie-chart"></i>
            </div>
            <h5 class="card-title fw-bold mb-0">決算・試算表</h5>
          </div>
          <div class="list-group list-group-flush">
            <a href="/reports/trial-balance" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-table me-2 text-success"></i> 残高試算表 v2</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/forms/financial-statement" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-file-earmark-bar-graph me-2 text-success"></i> 決算報告書 (B/S, P/L)</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/forms/invoice" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-receipt me-2 text-success"></i> 請求書発行</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="p-2 bg-info-subtle text-info rounded me-3 fs-4">
              <i class="bi bi-sliders"></i>
            </div>
            <h5 class="card-title fw-bold mb-0">マスタ・管理</h5>
          </div>
          <div class="list-group list-group-flush">
            <a href="/company" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-building me-2 text-info"></i> 取引先管理</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/item" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-box-seam me-2 text-info"></i> 品目マスタ</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
            <a href="/member" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
              <span><i class="bi bi-people me-2 text-info"></i> 役職員・メンバー</span>
              <i class="bi bi-chevron-right text-muted small"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
