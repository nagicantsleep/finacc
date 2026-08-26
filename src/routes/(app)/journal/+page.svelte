<script>
  export let data;
</script>

<svelte:head>
  <title>仕訳日記帳 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid p-4">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h3 class="fw-bold mb-1">仕訳日記帳 (Journal)</h3>
      <span class="badge bg-primary">第 {data.term} 期</span>
    </div>
    <div class="d-flex gap-2">
      <a href="/crossslip" class="btn btn-primary btn-sm">+ 振替伝票入力</a>
      <a href="/home" class="btn btn-outline-secondary btn-sm">ホームに戻る</a>
    </div>
  </div>

  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 10%;">日付</th>
              <th style="width: 10%;">伝票No</th>
              <th style="width: 20%;">借方科目 (Debit)</th>
              <th style="width: 20%;">貸方科目 (Credit)</th>
              <th style="width: 15%;" class="text-end">金額 (Amount)</th>
              <th style="width: 25%;">摘要 (Memo)</th>
            </tr>
          </thead>
          <tbody>
            {#if data.slips.length === 0}
              <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                  登録された仕訳伝票はありません。
                </td>
              </tr>
            {:else}
              {#each data.slips as slip}
                {#each slip.lines as line, idx}
                  <tr>
                    {#if idx === 0}
                      <td rowspan={slip.lines.length} class="align-top fw-bold">{slip.date}</td>
                      <td rowspan={slip.lines.length} class="align-top font-monospace">#{slip.slipNo}</td>
                    {/if}
                    <td class="text-primary fw-semibold">{line.debitAccountName}</td>
                    <td class="text-success fw-semibold">{line.creditAccountName}</td>
                    <td class="text-end font-monospace">{line.debitAmount.toLocaleString('ja-JP')}</td>
                    <td>{line.application}</td>
                  </tr>
                {/each}
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
