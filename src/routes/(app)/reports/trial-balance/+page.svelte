<script>
  export let data;
</script>

<svelte:head>
  <title>残高試算表 v2 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h3 class="fw-bold mb-1">残高試算表 (Trial Balance v2)</h3>
      <span class="badge bg-primary">第 {data.term} 期</span>
    </div>
    <div class="d-flex gap-2">
      <form method="GET">
        <select name="term" class="form-select form-select-sm" on:change={(e) => e.target.form.submit()}>
          {#each data.fiscalYears as fy}
            <option value={fy.term} selected={fy.term === data.term}>第 {fy.term} 期 ({fy.year}年度)</option>
          {/each}
        </select>
      </form>
      <a href="/home" class="btn btn-outline-secondary btn-sm">ホームに戻る</a>
    </div>
  </div>

  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th style="width: 15%;">科目コード</th>
              <th style="width: 35%;">勘定科目名</th>
              <th style="width: 15%;" class="text-end">借方合計 (Debit)</th>
              <th style="width: 15%;" class="text-end">貸方合計 (Credit)</th>
              <th style="width: 20%;" class="text-end">残高 (Balance)</th>
            </tr>
          </thead>
          <tbody>
            {#each data.rows as row}
              <tr>
                <td class="font-monospace fw-bold">{row.code}</td>
                <td>
                  <a href="/ledger?account={row.code}&term={data.term}" class="text-decoration-none fw-semibold">
                    {row.name}
                  </a>
                </td>
                <td class="text-end font-monospace">{row.debit.toLocaleString('ja-JP')}</td>
                <td class="text-end font-monospace">{row.credit.toLocaleString('ja-JP')}</td>
                <td class="text-end font-monospace fw-bold" class:text-danger={row.balance < 0}>
                  {row.balance.toLocaleString('ja-JP')}
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot class="table-secondary fw-bold">
            <tr>
              <td colspan="2" class="text-center">合計 (Totals)</td>
              <td class="text-end font-monospace">{data.totals.debit.toLocaleString('ja-JP')}</td>
              <td class="text-end font-monospace">{data.totals.credit.toLocaleString('ja-JP')}</td>
              <td class="text-end font-monospace">
                {#if data.totals.isBalanced}
                  <span class="badge bg-success">一致 (Balanced)</span>
                {:else}
                  <span class="badge bg-danger">不一致 (Unbalanced)</span>
                {/if}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>
