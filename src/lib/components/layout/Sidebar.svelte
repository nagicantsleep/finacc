<script>
  import { page } from '$app/stores';

  $: currentPath = $page.url.pathname;
</script>

<aside class="erp-sidebar bg-white border-end shadow-sm" style="width: 250px; min-width: 250px; min-height: calc(100vh - 56px);">
  <div class="py-3 px-2">
    <div class="mb-3">
      <div class="px-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">
        メインメニュー
      </div>
      <div class="nav flex-column nav-pills">
        <a href="/home" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath === '/home'}>
          <i class="bi bi-house-door me-2 text-primary"></i> ホーム
        </a>
      </div>
    </div>

    <div class="mb-3">
      <div class="px-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">
        伝票・日常業務
      </div>
      <div class="nav flex-column nav-pills">
        <a href="/crossslip" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/crossslip')}>
          <i class="bi bi-journal-plus me-2 text-info"></i> 振替伝票入力
        </a>
        <a href="/journal" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/journal')}>
          <i class="bi bi-journal-text me-2 text-info"></i> 仕訳日記帳
        </a>
        <a href="/ledger" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/ledger')}>
          <i class="bi bi-book me-2 text-info"></i> 総勘定元帳
        </a>
      </div>
    </div>

    <div class="mb-3">
      <div class="px-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">
        決算・試算表
      </div>
      <div class="nav flex-column nav-pills">
        <a href="/reports/trial-balance" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/reports/trial-balance')}>
          <i class="bi bi-table me-2 text-success"></i> 残高試算表 v2
        </a>
        <a href="/forms/financial-statement" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/forms/financial-statement')}>
          <i class="bi bi-file-earmark-bar-graph me-2 text-success"></i> 決算報告書 (B/S, P/L)
        </a>
      </div>
    </div>

    <div class="mb-3">
      <div class="px-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">
        帳票・請求書
      </div>
      <div class="nav flex-column nav-pills">
        <a href="/forms/invoice" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/forms/invoice')}>
          <i class="bi bi-receipt me-2 text-warning"></i> 請求書発行
        </a>
      </div>
    </div>

    <div class="mb-3">
      <div class="px-3 pb-1 text-uppercase text-muted fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">
        マスタ・管理
      </div>
      <div class="nav flex-column nav-pills">
        <a href="/company" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/company')}>
          <i class="bi bi-building me-2 text-secondary"></i> 取引先管理
        </a>
        <a href="/item" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/item')}>
          <i class="bi bi-box-seam me-2 text-secondary"></i> 品目マスタ
        </a>
        <a href="/member" class="nav-link px-3 py-2 text-dark rounded d-flex align-items-center mb-1" class:active-item={currentPath.startsWith('/member')}>
          <i class="bi bi-people me-2 text-secondary"></i> 役職員・メンバー
        </a>
      </div>
    </div>
  </div>
</aside>

<style>
  .nav-link:hover {
    background-color: #f1f5f9;
  }
  .active-item {
    background-color: #e0e7ff !important;
    color: #1e3a8a !important;
    font-weight: 600;
  }
</style>
