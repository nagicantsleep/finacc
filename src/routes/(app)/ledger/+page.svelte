<script>
  export let data;
</script>

<svelte:head>
  <title>総勘定元帳 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h3 class="fw-bold mb-1">総勘定元帳 (General Ledger)</h3>
      <span class="badge bg-primary me-2">第 {data.term} 期</span>
      <span class="badge bg-secondary">{data.account?.code} : {data.account?.name}</span>
    </div>
    <div class="d-flex gap-2">
      <form method="GET" class="d-flex gap-2">
        <input type="hidden" name="term" value={data.term} />
        <select name="account" class="form-select form-select-sm" on:change={(e) => e.target.form.submit()}>
          {#each data.accounts as acc}
            <option value={acc.code} selected={acc.code === data.accountCode}>
              {acc.code} : {acc.name}
            </option>
          {/each}
        </select>
      </form>
    </div>
  </div>

  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 15%;">日付</th>
              <th style="width: 15%;">伝票番号</th>
              <th style="width: 40%;">摘要</th>
              <th style="width: 15%;" class="text-end">借方金額</th>
              <th style="width: 15%;" class="text-end">貸方金額</th>
            </tr>
          </thead>
          <tbody>
            {#if data.lines.length === 0}
              <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                  この期間の明細はありません。
                </td>
              </tr>
            {:else}
              {#each data.lines as line}
                <tr>
                  <td>{line.date}</td>
                  <td>#{line.slipNo}</td>
                  <td>{line.application}</td>
                  <td class="text-end font-monospace">{line.debitAmount.toLocaleString('ja-JP')}</td>
                  <td class="text-end font-monospace">{line.creditAmount.toLocaleString('ja-JP')}</td>
                </tr>
              {/each}
            {/if}
          </tbody>
          <tfoot class="table-secondary fw-bold">
            <tr>
              <td colspan="3" class="text-center">合計 / 差引残高</td>
              <td class="text-end font-monospace">{data.summary.debitSum.toLocaleString('ja-JP')}</td>
              <td class="text-end font-monospace">{data.summary.creditSum.toLocaleString('ja-JP')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>
