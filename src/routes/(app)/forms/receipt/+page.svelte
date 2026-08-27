<script>
  export let data;

  const handlePrint = () => {
    window.print();
  };
</script>

<svelte:head>
  <title>領収証 ({data.receipt.no}) :: Hieronymus</title>
</svelte:head>

<div class="print-container p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 d-print-none border-bottom pb-2">
    <div>
      <a href="/home" class="btn btn-outline-secondary btn-sm me-2">← ホームへ戻る</a>
      <span class="fw-bold">領収証 印刷プレビュー</span>
    </div>
    <div>
      <button class="btn btn-primary btn-sm" on:click={handlePrint}>
        <i class="bi bi-printer me-1"></i> 印刷 / PDF保存
      </button>
    </div>
  </div>

  <div class="receipt-sheet bg-white p-5 shadow-sm border mx-auto" style="max-width: 700px;">
    <div class="d-flex justify-content-between align-items-start mb-4 border-bottom pb-3">
      <div>
        <h3 class="fw-bold tracking-wider mb-1">領 収 証</h3>
        <div class="text-muted small">RECEIPT</div>
      </div>
      <div class="text-end text-muted small">
        <div>No. <span class="font-monospace">{data.receipt.no}</span></div>
        <div>発行日: {data.receipt.date}</div>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="fw-bold border-bottom pb-2">{data.receipt.clientName}</h4>
    </div>

    <div class="p-4 bg-light rounded text-center mb-4 border">
      <div class="text-muted small mb-1">領収金額 (税込)</div>
      <div class="fs-2 fw-bold font-monospace text-dark">
        ¥{data.receipt.amount.toLocaleString('ja-JP')} -
      </div>
    </div>

    <div class="mb-4">
      <p class="mb-2"><strong>但し:</strong> {data.receipt.proviso}</p>
      <p class="small text-muted mb-0">上記正に領収いたしました。</p>
      <p class="small text-muted">(うち消費税額等: ¥{data.receipt.tax10.toLocaleString('ja-JP')})</p>
    </div>

    <div class="text-end mt-5 pt-3 border-top">
      <h5 class="fw-bold mb-1">{data.tenant.name}</h5>
      <div class="small text-muted">
        適格請求書発行事業者番号: T1234567890123<br />
        東京都千代田区1-1-1
      </div>
    </div>
  </div>
</div>

<style>
  @media print {
    :global(body) {
      background: #fff !important;
      padding: 0 !important;
    }
    .receipt-sheet {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
  }
</style>
