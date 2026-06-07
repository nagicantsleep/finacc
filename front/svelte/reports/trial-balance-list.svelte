<!--
  TrialBalanceList — 5-level hierarchy render (E1.3 + E1.4).

  Renders one row per line in the v2 contract (account | subAccount |
  subtotal), with a synthetic 'parent' row above each cluster of
  subAccount rows (大/中/小/勘定/補助科目). Expand/collapse is per account:
  the parent row carries a [+/-] button that toggles visibility of its
  subAccount children via the `expanded` set.

  Indent comes from the `indentClass(line)` helper in
  libs/reporting/tb-hierarchy.js, mapped to .tb-indent-0..4 in the
  <style> block.

  Props:
    lines          array of v2 lines (already through withAccountParents + applyExpandCollapse)
    expanded       Set<accountCode> of accounts that are currently expanded
    onToggle       (code) => void  — fired when the user clicks [+/-]
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
    {#each lines as l (keyFor(l))}
      <tr class:tb-subtotal={l.type === 'subtotal'}
          class:tb-parent={l.type === 'parent'}
          class={indentClass(l)}>
        <td class="tb-col-code">
          {#if l.type === 'subtotal'}
            <span class="tb-subtotal-label">【{l.level}】</span>
          {:else if l.type === 'parent'}
            <button type="button"
              class="btn btn-sm btn-link tb-toggle p-0 me-1"
              aria-label={isExpanded(l.code) ? 'collapse' : 'expand'}
              on:click={() => onToggle(l.code)}>
              {isExpanded(l.code) ? '−' : '+'}
            </button>
            <span class="tb-code-text">{l.code}</span>
          {:else if l.subCode != null}
            {l.code}-{l.subCode}
          {:else}
            {l.code}
          {/if}
        </td>
        <td class="tb-col-name">
          {#if l.type === 'subtotal'}
            <strong>{l.name || ''}</strong>
          {:else if l.type === 'parent'}
            <strong>{l.name || ''}</strong>
            {#if l.nameVi}<span class="tb-name-vi"> / {l.nameVi}</span>{/if}
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
  import { indentClass as _indentClass } from '../../../libs/reporting/tb-hierarchy.js';

  export let lines = [];
  export let expanded = new Set();
  export let onToggle = () => {};

  const formatNum = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };

  const isExpanded = (code) => code != null && expanded.has(code);

  const keyFor = (l) => {
    if (l.type === 'subtotal') return `subtotal:${l.level}:${l.major}:${l.middle}:${l.minor}`;
    if (l.type === 'parent') return `parent:${l.code}`;
    if (l.type === 'subAccount') return `sub:${l.code}:${l.subCode}`;
    return `account:${l.code}`;
  };

  // Re-export for template use
  const indentClass = _indentClass;
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

  /* 5-level indent: 大/中/小/勘定/補助 */
  .tb-indent-0 td.tb-col-code { padding-left: 0.5rem; }
  .tb-indent-1 td.tb-col-code { padding-left: 1.25rem; }
  .tb-indent-2 td.tb-col-code { padding-left: 2.0rem; }
  .tb-indent-3 td.tb-col-code { padding-left: 2.75rem; }
  .tb-indent-4 td.tb-col-code { padding-left: 3.75rem; }
  .tb-indent-3 td.tb-col-name,
  .tb-indent-4 td.tb-col-name { padding-left: 0.5rem; }

  .tb-parent { background: #fafafa; }
  .tb-parent .tb-col-name { font-weight: 600; }
  .tb-parent .tb-col-num { font-weight: 500; }
  .tb-toggle {
    display: inline-block;
    width: 1.4em;
    line-height: 1;
    font-weight: 600;
    color: #555;
    text-decoration: none;
    font-family: monospace;
  }
  .tb-toggle:hover { color: #000; }
  .tb-code-text { font-family: monospace; }
</style>
