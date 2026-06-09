<!--
  TrialBalanceList — 5-level hierarchy render (E1.3 + E1.4).

  Renders one row per line in the v2 contract (account | subAccount |
  subtotal), with a synthetic 'parent' row above each cluster of
  subAccount rows (大/中/小/勘定/補助科目). Expand/collapse lives in a
  dedicated narrow column (chevron); the code column shows account codes only.

  Indent comes from the `indentClass(line)` helper in
  libs/reporting/tb-hierarchy.js, mapped to .tb-indent-0..4 in the
  <style> block.

  Props:
    lines          array of v2 lines (already through withAccountParents + applyExpandCollapse)
    expanded       Set<accountCode> of accounts that are currently expanded
    languageMode   'ja' | 'vi' | 'ja-vi' | 'vi-ja'  — drives name rendering
    reportType     'balance' | 'movement' | 'combined' — controls which numeric columns to show
    onToggle       (code) => void       — fired when the user clicks [+/-]
    onRowClick     (line) => void       — fired when a data row is clicked (parent | account | subAccount)
-->
{#if true}
  {@const showOpening = reportType === 'balance' || reportType === 'combined'}
  {@const showMovement = reportType === 'movement' || reportType === 'combined'}
  {@const showEnding = reportType === 'balance' || reportType === 'combined'}
  {@const showBalance = reportType === 'balance' || reportType === 'combined' || reportType === 'movement'}
  {@const colCount = 3 + (showOpening ? 2 : 0) + (showMovement ? 2 : 0) + (showEnding ? 2 : 0) + (showBalance ? 1 : 0)}
<table class="table table-bordered table-sm tb-v2-table">
  <thead class="tb-v2-thead">
    <tr>
      <th scope="col" class="tb-col-expand" aria-label="expand"></th>
      <th scope="col" class="tb-col-code"><BilingualText primary="科目" secondary="Mã" /></th>
      <th scope="col" class="tb-col-name"><BilingualText key="account_name" /></th>
      {#if showOpening}
        <th scope="col" class="tb-col-num"><BilingualText primary="期首借方" secondary="Dư đầu kỳ - Nợ" /></th>
        <th scope="col" class="tb-col-num"><BilingualText primary="期首貸方" secondary="Dư đầu kỳ - Có" /></th>
      {/if}
      {#if showMovement}
        <th scope="col" class="tb-col-num"><BilingualText primary="期間借方" secondary="Phát sinh - Nợ" /></th>
        <th scope="col" class="tb-col-num"><BilingualText primary="期間貸方" secondary="Phát sinh - Có" /></th>
      {/if}
      {#if showEnding}
        <th scope="col" class="tb-col-num"><BilingualText primary="期末借方" secondary="Dư cuối kỳ - Nợ" /></th>
        <th scope="col" class="tb-col-num"><BilingualText primary="期末貸方" secondary="Dư cuối kỳ - Có" /></th>
      {/if}
      {#if showBalance}
        <th scope="col" class="tb-col-num"><BilingualText key="balance" /></th>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each lines as l (keyFor(l))}
      <tr class:tb-subtotal={l.type === 'subtotal'}
          class:tb-parent={l.type === 'parent'}
          class:tb-clickable={l.type !== 'subtotal'}
          class:tb-warning-row={(l.warningCodes || []).some((c) => c === 'TB-W005')}
          class={indentClass(l)}
          on:click={() => onRowClick(l)}>
        <td class="tb-col-expand">
          {#if l.type === 'parent'}
            <button type="button"
              class="btn btn-sm btn-link tb-toggle p-0"
              aria-label={isExpanded(l.code) ? 'collapse' : 'expand'}
              aria-expanded={isExpanded(l.code)}
              on:click|stopPropagation={() => onToggle(l.code)}>
              <i class="bi {isExpanded(l.code) ? 'bi-chevron-down' : 'bi-chevron-right'}" aria-hidden="true"></i>
            </button>
          {/if}
        </td>
        <td class="tb-col-code" class:tb-code-parent={l.type === 'parent'} class:tb-code-sub={l.type === 'subAccount'}>
          {#if l.type !== 'subtotal' && l.code != null}
            {#if l.subCode != null}
              {l.code}-{l.subCode}
            {:else}
              {l.code}
            {/if}
          {/if}
        </td>
        <td class="tb-col-name">
          {#if l.type === 'subtotal'}
            {@const lvl = subtotalLevelLabel(l.level)}
            {@const dn = pickDisplayName({ name: l.name, nameVi: l.nameVi, code: l.code }, languageMode)}
            <span class="tb-subtotal-badge">
              <BilingualText primary={lvl.primary} secondary={lvl.secondary} stacked={false} />
            </span>
            <strong>{dn.primary}</strong>
            {#if dn.secondary}<span class="tb-name-vi"> / {dn.secondary}</span>{/if}
          {:else if l.type === 'parent'}
            {@const dn = pickDisplayName({ name: l.name, nameVi: l.nameVi, code: l.code }, languageMode)}
            <strong>{dn.primary}</strong>
            {#if dn.secondary}<span class="tb-name-vi"> / {dn.secondary}</span>{/if}
          {:else if l.subAccountId != null}
            {@const dn = pickDisplayName({ name: l.subName, nameVi: l.subNameVi, code: `${l.code}-${l.subCode}` }, languageMode)}
            <span class="tb-sub-name">└ {dn.primary}</span>
            {#if dn.secondary}<span class="tb-sub-name-vi"> / {dn.secondary}</span>{/if}
          {:else}
            {@const dn = pickDisplayName({ name: l.name, nameVi: l.nameVi, code: l.code }, languageMode)}
            {dn.primary}
            {#if dn.secondary}<span class="tb-name-vi"> / {dn.secondary}</span>{/if}
          {/if}
        </td>
        {#if showOpening}
          <td class="tb-col-num">{formatNum(l.openingDebit)}</td>
          <td class="tb-col-num">{formatNum(l.openingCredit)}</td>
        {/if}
        {#if showMovement}
          <td class="tb-col-num">{formatNum(l.movementDebit)}</td>
          <td class="tb-col-num">{formatNum(l.movementCredit)}</td>
        {/if}
        {#if showEnding}
          <td class="tb-col-num">{formatNum(l.endingDebit)}</td>
          <td class="tb-col-num">{formatNum(l.endingCredit)}</td>
        {/if}
        {#if showBalance}
          <td class="tb-col-num tb-col-balance" class:tb-balance-negative={(l.balance || 0) < 0}>
            {formatNum(l.balance)}
          </td>
        {/if}
      </tr>
    {/each}
    {#if lines.length === 0}
      <tr><td colspan={colCount} class="text-center text-muted">データなし / Không có dữ liệu</td></tr>
    {/if}
  </tbody>
</table>
{/if}

<script>
  import { indentClass as _indentClass } from '../../../libs/reporting/tb-hierarchy.js';
  import { pickDisplayName } from '../../../libs/reporting/tb-language.js';
  import BilingualText from '../components/bilingual-text.svelte';

  export let lines = [];
  export let expanded = new Set();
  export let languageMode = 'ja-vi';
  export let reportType = 'combined';
  export let onToggle = () => {};
  export let onRowClick = () => {};

  const formatNum = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };

  const isExpanded = (code) => code != null && expanded.has(code);

  const SUBTOTAL_LEVEL_LABELS = {
    major: { primary: '大計', secondary: 'Tổng cấp lớn' },
    middle: { primary: '中計', secondary: 'Tổng cấp trung' },
    minor: { primary: '小計', secondary: 'Tổng cấp nhỏ' },
  };

  const subtotalLevelLabel = (level) =>
    SUBTOTAL_LEVEL_LABELS[level] || { primary: level || '', secondary: null };

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
  /* Dark bilingual header — matches global .table thead (#184). */
  .tb-v2-thead th {
    position: sticky;
    top: 0;
    z-index: 5;
    background-color: #264653 !important;
    color: #fff !important;
    --bs-table-bg: #264653;
    --bs-table-color: #fff;
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.2);
    vertical-align: middle;
  }
  .tb-v2-thead th :global(.bilingual-secondary),
  .tb-v2-thead th :global(.bilingual-sep) {
    color: #b8c5c9;
    opacity: 1;
  }
  .tb-v2-thead th.tb-col-num { white-space: normal; text-align: right; }
  .tb-col-expand {
    width: 1.75rem;
    min-width: 1.75rem;
    max-width: 1.75rem;
    padding: 0.25rem 0.15rem;
    text-align: center;
    vertical-align: middle;
  }
  .tb-v2-thead th.tb-col-expand { padding: 0.25rem; }
  .tb-col-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tb-col-code { font-family: monospace; word-break: break-all; max-width: 11rem; min-width: 6rem; }
  .tb-code-parent { font-weight: 600; }
  .tb-code-sub { color: #555; }
  .tb-col-name { min-width: 14rem; }
  .tb-col-balance { font-weight: 500; }
  .tb-balance-negative { color: #c00000; }
  .tb-subtotal { background: #f3f3f3; }
  .tb-subtotal .tb-col-num { font-weight: 600; }
  .tb-subtotal-badge {
    display: inline-block;
    margin-right: 0.4rem;
    padding: 0.05rem 0.35rem;
    border-radius: 0.2rem;
    background: #e2e2e2;
    color: #444;
    font-size: 0.75rem;
    font-weight: 600;
    vertical-align: baseline;
  }
  .tb-subtotal-badge :global(.bilingual-secondary) {
    color: #666;
    font-weight: 500;
  }
  .tb-sub-name { color: #555; }
  .tb-sub-name-vi, .tb-name-vi { color: #777; font-size: 0.85em; }

  /* 5-level indent: 大/中/小/勘定/補助 */
  .tb-indent-0 td.tb-col-expand { padding-left: 0.25rem; }
  .tb-indent-1 td.tb-col-expand { padding-left: 0.75rem; }
  .tb-indent-2 td.tb-col-expand { padding-left: 1.25rem; }
  .tb-indent-3 td.tb-col-expand { padding-left: 1.75rem; }
  .tb-indent-4 td.tb-col-expand { padding-left: 2.25rem; }
  .tb-indent-3 td.tb-col-name,
  .tb-indent-4 td.tb-col-name { padding-left: 0.5rem; }

  .tb-parent { background: #fafafa; }
  .tb-parent .tb-col-name { font-weight: 600; }
  .tb-parent .tb-col-num { font-weight: 500; }
  .tb-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    line-height: 1;
    color: #555;
    text-decoration: none;
  }
  .tb-toggle:hover { color: #000; }
  .tb-toggle .bi { font-size: 0.85rem; }
  .tb-clickable { cursor: pointer; }
  .tb-clickable:hover { background: #f0f6ff; }
  .tb-warning-row { background: #fde7e7; }
  .tb-warning-row:hover { background: #fbd0d0; }
</style>
