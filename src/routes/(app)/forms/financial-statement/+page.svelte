<script>
  export let data;

  const handlePrint = () => {
    window.print();
  };
</script>

<svelte:head>
  <title>決算報告書 (第{data.fy.term}期) :: Hieronymus</title>
</svelte:head>

<div class="print-container p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 d-print-none border-bottom pb-2">
    <div>
      <a href="/home" class="btn btn-outline-secondary btn-sm me-2">← ホームへ戻る</a>
      <span class="fw-bold">決算報告書 印刷プレビュー</span>
    </div>
    <div>
      <button class="btn btn-primary btn-sm" on:click={handlePrint}>
        <i class="bi bi-printer me-1"></i> 印刷 / PDF保存
      </button>
    </div>
  </div>

  <div class="statement-sheet bg-white p-5 shadow-sm border mx-auto" style="max-width: 900px;">
    <div class="text-center mb-5">
      <h2 class="fw-bold tracking-wider mb-1">決 算 報 告 書</h2>
      <p class="text-muted mb-0">第 {data.fy.term} 期 ({data.fy.year}年度)</p>
      <p class="small text-muted">
        自: {new Date(data.fy.startDate).toLocaleDateString('ja-JP')} 〜 至: {new Date(data.fy.endDate).toLocaleDateString('ja-JP')}
      </p>
      <h5 class="fw-bold mt-2">{data.tenant.name}</h5>
    </div>

    <!-- P/L Statement -->
    <h4 class="fw-bold border-bottom pb-2 mb-3">損益計算書 (Profit & Loss Statement)</h4>
    <table class="table table-bordered align-middle mb-5">
      <thead class="table-light">
        <tr>
          <th style="width: 20%;">科目コード</th>
          <th style="width: 40%;">勘定科目名</th>
          <th style="width: 20%;" class="text-end">当期借方</th>
          <th style="width: 20%;" class="text-end">当期貸方</th>
        </tr>
      </thead>
      <tbody>
        {#each data.plRows as row}
          <tr>
            <td class="font-monospace">{row.code}</td>
            <td class="fw-semibold">{row.name}</td>
            <td class="text-end font-monospace">{row.debit.toLocaleString('ja-JP')}</td>
            <td class="text-end font-monospace">{row.credit.toLocaleString('ja-JP')}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot class="table-secondary fw-bold">
        <tr>
          <td colspan="2" class="text-center">合計</td>
          <td class="text-end font-monospace">{data.totals.debit.toLocaleString('ja-JP')}</td>
          <td class="text-end font-monospace">{data.totals.credit.toLocaleString('ja-JP')}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

<style>
  @media print {
    :global(body) {
      background: #fff !important;
      padding: 0 !important;
    }
    .statement-sheet {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
  }
</style>
