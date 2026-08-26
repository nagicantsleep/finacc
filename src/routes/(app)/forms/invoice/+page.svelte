<script>
  export let data;

  const handlePrint = () => {
    window.print();
  };
</script>

<svelte:head>
  <title>請求書 ({data.invoice.no}) :: Hieronymus</title>
</svelte:head>

<div class="print-container p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 d-print-none border-bottom pb-2">
    <div>
      <a href="/home" class="btn btn-outline-secondary btn-sm me-2">← ホームへ戻る</a>
      <span class="fw-bold">請求書 印刷プレビュー</span>
    </div>
    <div>
      <button class="btn btn-primary btn-sm" on:click={handlePrint}>
        <i class="bi bi-printer me-1"></i> 印刷 / PDF保存
      </button>
    </div>
  </div>

  <div class="invoice-sheet bg-white p-5 shadow-sm border mx-auto" style="max-width: 800px;">
    <div class="text-center mb-5">
      <h2 class="fw-bold tracking-wider mb-1">御 請 求 書</h2>
      <div class="text-muted small">INVOICE</div>
    </div>

    <div class="row mb-4">
      <div class="col-7">
        <h4 class="fw-bold border-bottom pb-2 mb-3">{data.company.name}</h4>
        <p class="mb-1">下記の通りご請求申し上げます。</p>
        <div class="p-3 bg-light rounded mt-3">
          <div class="d-flex justify-content-between align-items-center">
            <span class="fs-5 fw-bold">ご請求金額 (税込):</span>
            <span class="fs-4 fw-bold font-monospace text-primary">¥{data.invoice.total.toLocaleString('ja-JP')} -</span>
          </div>
        </div>
      </div>

      <div class="col-5 text-end">
        <p class="mb-1 text-muted">請求書番号: <span class="font-monospace">{data.invoice.no}</span></p>
        <p class="mb-1 text-muted">請求日: {data.invoice.date}</p>
        <p class="mb-3 text-muted">お支払期日: {data.invoice.dueDate}</p>

        <h5 class="fw-bold mb-1">{data.tenant.name}</h5>
        <p class="small text-muted mb-0">
          適格請求書発行事業者番号: T1234567890123<br />
          東京都千代田区1-1-1<br />
          TEL: 03-0000-0000
        </p>
      </div>
    </div>

    <table class="table table-bordered align-middle mb-4">
      <thead class="table-light">
        <tr>
          <th>品目・内容</th>
          <th class="text-center" style="width: 12%;">数量</th>
          <th class="text-center" style="width: 12%;">単位</th>
          <th class="text-end" style="width: 18%;">単価</th>
          <th class="text-end" style="width: 20%;">金額</th>
        </tr>
      </thead>
      <tbody>
        {#each data.invoice.lines as line}
          <tr>
            <td>{line.name}</td>
            <td class="text-center">{line.quantity}</td>
            <td class="text-center">{line.unit}</td>
            <td class="text-end font-monospace">¥{line.unitPrice.toLocaleString('ja-JP')}</td>
            <td class="text-end font-monospace fw-semibold">¥{line.amount.toLocaleString('ja-JP')}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-end">小計 (税抜)</td>
          <td class="text-end font-monospace">¥{data.invoice.subtotal.toLocaleString('ja-JP')}</td>
        </tr>
        <tr>
          <td colspan="4" class="text-end">消費税等 (10%対象)</td>
          <td class="text-end font-monospace">¥{data.invoice.tax10.toLocaleString('ja-JP')}</td>
        </tr>
        <tr class="table-light fw-bold">
          <td colspan="4" class="text-end fs-6">合計金額</td>
          <td class="text-end font-monospace fs-6 text-primary">¥{data.invoice.total.toLocaleString('ja-JP')}</td>
        </tr>
      </tfoot>
    </table>

    <div class="border p-3 rounded small bg-light">
      <div class="fw-bold mb-1">【お振込先】</div>
      <div>〇〇銀行 本店営業部 (普通) 1234567</div>
      <div>口座名義: {data.tenant.name}</div>
    </div>
  </div>
</div>

<style>
  @media print {
    :global(body) {
      background: #fff !important;
      padding: 0 !important;
    }
    .invoice-sheet {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
  }
</style>
