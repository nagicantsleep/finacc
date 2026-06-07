<!--
  Trial Balance v2 — Issue #209 (E1.3).

  New view /reports/trial-balance with three report-type tabs:
    - balance    残高試算表       (default)
    - movement   合計試算表
    - combined   合計残高試算表

  Phase-1 scope (E1.3):
    - 3-tab nav, bilingual header
    - Period selector (current FY + month picker — full filter in E1.8)
    - Calls GET /api/trial-balance?version=2&reportType=...
    - Renders flat lines with subtotal rows (via libs/reporting/tb-subtotal)
    - Subtotal rows visually distinct; no expand/collapse (E1.4)

  Out of scope: drill-down modal (E1.5), warnings banner (E1.6),
  export (E1.7), full filter UI (E1.8), bilingual mode selector (E1.9),
  legacy remove (E1.10).
-->
{#key $currentPage}
<div class="container-fluid">
  <div class="page-title d-flex justify-content-between mt-2">
    <h1 class="page-title-bilingual">
      <BilingualText key="trial_balance" inline={true} />
      <span class="tb-v2-badge">v2</span>
    </h1>
    <div>
      <a class="btn btn-outline-secondary btn-bilingual" href="/trial-balance">
        <BilingualText primary="旧画面" secondary="(Legacy)" inline={true} />
      </a>
    </div>
  </div>

  <ul class="nav nav-tabs tb-tabs" role="tablist">
    {#each tabs as t}
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link tb-tab"
          class:active={reportType === t.value}
          on:click={() => selectTab(t.value)}
          role="tab"
          aria-selected={reportType === t.value}>
          <BilingualText key={t.key} inline={true} />
        </button>
      </li>
    {/each}
  </ul>

  <div class="row page-subtitle align-items-center mt-2">
    <div class="col-md-auto">
      <label class="tb-period-label">
        <BilingualText primary="期間" secondary="Kỳ" inline={true} />:
      </label>
    </div>
    <div class="col-md-auto">
      <input
        type="month"
        class="form-control form-control-sm"
        bind:value={monthInput}
        on:change={onMonthChange} />
    </div>
    <div class="col-md-auto">
      <button type="button" class="btn btn-sm btn-outline-secondary"
        on:click={resetPeriod}>
        <BilingualText primary="年度全体" secondary="Cả năm" inline={true} />
      </button>
    </div>
    <div class="col-md-auto tb-meta" role="status">
      {#if loading}
        <span class="text-muted">...</span>
      {:else if error}
        <span class="text-danger">{error}</span>
      {:else if meta}
        <span class="text-muted">
          {meta.period?.label || 'full'} · {meta.totals ? formatInt(meta.totals.movementDebit) + ' / ' + formatInt(meta.totals.movementCredit) : ''}
        </span>
      {/if}
    </div>
  </div>

  <div class="row body-height">
    <TrialBalanceList lines={lines} />
  </div>
</div>
{/key}

<script>
  import axios from 'axios';
  import { currentPage, link } from '../../javascripts/router.js';
  import { languagePair } from '../../javascripts/bilingual.js';
  import BilingualText from '../components/bilingual-text.svelte';
  import TrialBalanceList from './trial-balance-list.svelte';
  import { buildSubtotals } from '../../../libs/reporting/tb-subtotal.js';

  export let status;

  const tabs = [
    { value: 'balance',  key: 'report_trial_balance' },
    { value: 'movement', key: 'report_trial_balance_movement' },
    { value: 'combined', key: 'report_trial_balance_combined' },
  ];

  let reportType = 'balance';
  let monthInput = '';
  let lines = [];
  let meta = null;
  let loading = false;
  let error = null;
  let lastFetched = '';

  $: if ($currentPage && $currentPage !== lastFetched) {
    syncFromUrl();
    lastFetched = $currentPage;
    fetchData();
  }
  $: if (status && status.fy && status.fy.term && lastFetched && !loading && lines.length === 0 && !error) {
    // initial mount when status is ready
    fetchData();
  }

  const syncFromUrl = () => {
    const path = $currentPage || '';
    const m = path.match(/^\/reports\/trial-balance\/([^/]+)/);
    if (m) {
      const param = m[1];
      const ym = param.match(/^(\d{4})-(\d{1,2})$/);
      if (ym) {
        monthInput = `${ym[1]}-${String(ym[2]).padStart(2, '0')}`;
      } else {
        monthInput = '';
        if (param === 'balance' || param === 'movement' || param === 'combined') {
          reportType = param;
        }
      }
    } else {
      monthInput = '';
    }
  };

  const selectTab = (value) => {
    reportType = value;
    pushUrl();
    fetchData();
  };

  const onMonthChange = () => {
    pushUrl();
    fetchData();
  };

  const resetPeriod = () => {
    monthInput = '';
    pushUrl();
    fetchData();
  };

  const pushUrl = () => {
    const base = '/reports/trial-balance';
    const parts = [];
    if (monthInput) parts.push(monthInput);
    parts.push(reportType);
    const href = `${base}/${parts.join('/')}`;
    if (href !== $currentPage) link(href);
  };

  const fetchData = async () => {
    if (!status || !status.fy || !status.fy.term) return;
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      params.set('version', '2');
      params.set('reportType', reportType);
      if (monthInput) params.set('month', monthInput);
      const lp = $languagePair;
      if (lp) params.set('languagePair', JSON.stringify(lp));
      const url = `/api/trial-balance?${params.toString()}`;
      const r = await axios.get(url);
      meta = r.data.meta;
      lines = buildSubtotals(r.data.lines || []);
    } catch (e) {
      error = e?.response?.data?.error || e.message || 'fetch failed';
      lines = [];
      meta = null;
    } finally {
      loading = false;
    }
  };

  const formatInt = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };
</script>

<style>
  .tb-v2-badge {
    display: inline-block;
    font-size: 0.7em;
    background: #0e8a16;
    color: #fff;
    padding: 0.1em 0.4em;
    border-radius: 0.25em;
    margin-left: 0.4em;
    vertical-align: middle;
  }
  .tb-tabs { margin-top: 0.5rem; }
  .tb-tab { min-width: 9rem; }
  .tb-period-label { font-weight: 500; }
  .tb-meta { font-size: 0.85rem; }
</style>
