<!--
  TrialBalanceList — flat table render for v2 lines (E1.3).

  Renders one row per line. Subtotal rows are visually distinguished (bold,
  light grey background) but no expand/collapse here — that lives in E1.4.
  All six numeric columns are shown; the tab on the parent decides which
  to emphasize, but the API returns the full set so this component stays
  reportType-agnostic.

  Props:
    lines  — array of v2 lines (account | subAccount | subtotal)
-->
<table class="table table-bordered table-sm tb-v2-table">
  <thead class="table-light">
    <tr>
      <th scope="col" class="tb-col-code">科目 / Mã</th>
      <th scope="col" class="tb-col-name">科目名 / Tên</th>
      <th scope="col" class="tb-col-num">期首借方<br/>Dư đầu kỳ - Nợ</th>
      <th scope="col" class="tb-col-num">期首貸方<br/>Dư đầu kỳ - Có</th>
      <th scope="col" class="tb-col-num">期間借方<br/>Phát sinh - Nợ</th>
      <th scope="col" class="tb-col-num">期間貸方<br/>Phát sinh - Có</th>
      <th scope="col" class="tb-col-num">期末借方<br/>Dư cuối kỳ - Nợ</th>
      <th scope="col" class="tb-col-num">期末貸方<br/>Dư cuối kỳ - Có</th>
      <th scope="col" class="tb-col-num">残高<br/>Số dư</th>
    </tr>
  </thead>
  <tbody>
    {#each lines as l (l.type + ':' + (l.code || l.major) + ':' + (l.subCode || '') + ':' + (l.level || ''))}
      <tr class:tb-subtotal={l.type === 'subtotal'}>
        <td class="tb-col-code">
          {#if l.type === 'subtotal'}
            <span class="tb-subtotal-label">【{l.level}】</span>
          {:else if l.subCode != null}
            {l.code}-{l.subCode}
          {:else}
            {l.code}
          {/if}
        </td>
        <td class="tb-col-name">
          {#if l.type === 'subtotal'}
            <strong>{l.name || ''}</strong>
          {:else if l.subAccountId != null}
            <span class="tb-sub-name">└ {l.subName || ''}</span>
            {#if l.subNameVi}<span class="tb-sub-name-vi"> / {l.subNameVi}</span>{/if}
          {:else}
            {l.name || ''}
            {#if l.nameVi}<span class="tb-name-vi"> / {l.nameVi}</span>{/if}
          {/if}
        </td>
        <td class="tb-col-num">{formatNum(l.openingDebit)}</td>
        <td class="tb-col-num">{formatNum(l.openingCredit)}</td>
        <td class="tb-col-num">{formatNum(l.movementDebit)}</td>
        <td class="tb-col-num">{formatNum(l.movementCredit)}</td>
        <td class="tb-col-num">{formatNum(l.endingDebit)}</td>
        <td class="tb-col-num">{formatNum(l.endingCredit)}</td>
        <td class="tb-col-num tb-col-balance" class:tb-balance-negative={(l.balance || 0) < 0}>
          {formatNum(l.balance)}
        </td>
      </tr>
    {/each}
    {#if lines.length === 0}
      <tr><td colspan="9" class="text-center text-muted">データなし / Không có dữ liệu</td></tr>
    {/if}
  </tbody>
</table>

<script>
  export let lines = [];

  const formatNum = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };
</script>

<style>
  .tb-v2-table { font-size: 0.9rem; }
  .tb-col-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tb-col-code { font-family: monospace; white-space: nowrap; width: 9rem; }
  .tb-col-name { min-width: 14rem; }
  .tb-col-balance { font-weight: 500; }
  .tb-balance-negative { color: #c00000; }
  .tb-subtotal { background: #f3f3f3; }
  .tb-subtotal .tb-col-num { font-weight: 600; }
  .tb-subtotal-label { color: #666; font-size: 0.8rem; }
  .tb-sub-name { color: #555; }
  .tb-sub-name-vi, .tb-name-vi { color: #777; font-size: 0.85em; }
</style>
