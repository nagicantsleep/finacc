<script>
  export let data;
</script>

<svelte:head>
  <title>ホーム :: Hieronymus</title>
</svelte:head>

<div class="home-page p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h3 class="fw-bold mb-1">{data.tenant.name}</h3>
      <span class="badge bg-primary me-2">第 {data.currentFy.term} 期 ({data.currentFy.year}年度)</span>
      <span class="text-muted small">
        期間: {new Date(data.currentFy.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(data.currentFy.endDate).toLocaleDateString('ja-JP')}
      </span>
    </div>
    <div class="d-flex gap-2">
      <a href="/logon" class="btn btn-outline-secondary btn-sm">テナント切替</a>
      <form action="/logon?/logout" method="POST">
        <button type="submit" class="btn btn-outline-danger btn-sm">ログアウト</button>
      </form>
    </div>
  </div>

  <div class="row g-4">
    <!-- Quick Navigation Cards -->
    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body">
          <h5 class="card-title fw-bold text-primary mb-3">伝票・日常業務</h5>
          <div class="list-group list-group-flush">
            <a href="/journal" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              仕訳日記帳
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/ledger" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              総勘定元帳
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/bank-ledger" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              銀行元帳
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/crossslip" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              振替伝票入力
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body">
          <h5 class="card-title fw-bold text-success mb-3">決算・試算表</h5>
          <div class="list-group list-group-flush">
            <a href="/reports/trial-balance" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              残高試算表 v2
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/reports/financial-statement" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              決算報告書 (B/S, P/L)
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/closing" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              決算・年次繰越
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/changes" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              残高推移グラフ
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card shadow-sm border-0 h-100">
        <div class="card-body">
          <h5 class="card-title fw-bold text-info mb-3">マスタ・管理</h5>
          <div class="list-group list-group-flush">
            <a href="/company" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              取引先（顧客・仕入先）
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/item" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              品目マスタ
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/member" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              役職員・メンバー
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
            <a href="/simulation" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              財務シミュレーション
              <i class="bi bi-chevron-right text-muted"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
