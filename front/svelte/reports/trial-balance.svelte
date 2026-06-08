<!--
  Trial Balance v2 — Issue #209 (E1.3) + #210 (E1.4).

  3 tabs (balance/movement/combined), bilingual header, period selector,
  5-level hierarchy with per-account expand/collapse (E1.4).

  Out of scope: drill-down modal (E1.5), warnings banner (E1.6),
  export (E1.7), full filter UI (E1.8), bilingual mode selector (E1.9),
  legacy remove (E1.10).
-->
{#key $currentPage}
<div class="container-fluid">
  {#if mode === 'simulation'}
    <div class="tb-sim-banner">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>
        SIMULATION - NOT OFFICIAL ACCOUNTING REPORT
        {#if selectedScenario} · {selectedScenario.name} ({selectedScenario.status}){/if}
      </span>
    </div>
  {/if}
  <div class="page-title d-flex justify-content-between mt-2">
    <h1 class="page-title-bilingual">
      <BilingualText key="trial_balance" inline={true} />
      <span class="tb-v2-badge">v2</span>
    </h1>
    <div>
      <button type="button" class="btn btn-primary btn-bilingual me-2"
        on:click={downloadExcel} disabled={loading || !status?.fy?.term}>
        <BilingualText primary="Excel出力" secondary="Xuất Excel" inline={true} />
        <i class="bi bi-download"></i>
      </button>
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
        <BilingualText primary="モード" secondary="Chế độ" inline={true} />:
      </label>
    </div>
    <div class="col-md-auto">
      <select class="form-select form-select-sm" bind:value={mode} on:change={onModeChange}>
        <option value="actual">実績 / Thực tế</option>
        <option value="simulation">シミュレーション / Mô phỏng</option>
      </select>
    </div>
    {#if mode === 'simulation'}
      <div class="col-md-auto">
        <select class="form-select form-select-sm" bind:value={scenarioId} on:change={onScenarioChange}>
          <option value="">-- シナリオ選択 / Chọn kịch bản --</option>
          {#each scenarioOptions as s (s.id)}
            <option value={s.id}>{s.name} ({s.status})</option>
          {/each}
        </select>
      </div>
    {/if}
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
    <div class="col-md-auto">
      <label class="tb-hide-zero-label">
        <input type="checkbox" bind:checked={hideZero} on:change={onFilterChange} />
        <BilingualText primary="ゼロ非表示" secondary="Ẩn số 0" inline={true} />
      </label>
    </div>
    <div class="col-md-auto">
      <button type="button" class="btn btn-sm btn-outline-secondary"
        on:click={expandAll}>
        <BilingualText primary="すべて展開" secondary="Mở rộng" inline={true} />
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary ms-1"
        on:click={collapseAll}>
        <BilingualText primary="すべて折りたたみ" secondary="Thu gọn" inline={true} />
      </button>
    </div>
    <div class="col-md-auto">
      <button type="button" class="btn btn-sm btn-outline-danger"
        on:click={resetAll}>
        <BilingualText primary="フィルタをリセット" secondary="Đặt lại" inline={true} />
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

  {#if availableClasses.length > 0}
    <div class="row page-subtitle align-items-center mt-1">
      <div class="col-md-auto">
        <label class="tb-period-label">
          <BilingualText primary="科目区分" secondary="Loại TK" inline={true} />:
        </label>
      </div>
      <div class="col-md-auto tb-class-chips">
        {#each availableClasses as cls (cls.id)}
          <label class="tb-class-chip"
            class:tb-class-chip-off={accountClassFilter.size > 0 && !accountClassFilter.has(cls.id)}>
            <input type="checkbox"
              checked={accountClassFilter.size === 0 || accountClassFilter.has(cls.id)}
              on:change={() => toggleClass(cls.id)} />
            <span class="tb-class-code">{cls.aclCode}</span>
            <span class="tb-class-name">{cls.major} {#if cls.middle}/ {cls.middle}{/if}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

  {#if activeFilterChips.length > 0}
    <div class="row page-subtitle align-items-center mt-1">
      <div class="col-md-auto">
        <span class="tb-period-label">
          <BilingualText primary="適用中" secondary="Đang áp dụng" inline={true} />:
        </span>
      </div>
      <div class="col-md-auto tb-active-chips">
        {#each activeFilterChips as c (c.key)}
          <span class="tb-active-chip">
            {c.label}
            <button type="button" class="tb-active-chip-x"
              aria-label="remove filter"
              on:click={() => removeChip(c.key)}>×</button>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  {#if warnings && warnings.length > 0}
    <div class="tb-warnings mt-2">
      {#each warnings as w (w.code + JSON.stringify(w.detail || {}))}
        <div class="alert tb-warning tb-warning-{w.severity}" role="alert">
          <strong>[{w.code}]</strong>
          <span class="tb-warning-title">{w.title} / {w.titleVi}</span>
          {#if w.detail}
            <span class="tb-warning-detail">
              {#if w.code === 'TB-W001'}
                D={formatInt(w.detail.movementDebit)} · C={formatInt(w.detail.movementCredit)} · diff={formatInt(w.detail.diff)}
              {:else if w.code === 'TB-W002'}
                {w.detail.count} unapproved slip(s) in this term
              {:else if w.detail.error}
                {w.detail.error}
              {/if}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="row body-height">
    <TrialBalanceList
      lines={visibleLines}
      {expanded}
      {languageMode}
      onToggle={toggleAccount}
      onRowClick={openDrillDown} />
  </div>
</div>

<TrialBalanceDrillDown
  bind:this={drilldown}
  term={status?.fy?.term}
  accountCode={drillAccount?.code}
  subCode={drillAccount?.subCode}
  accountName={drillAccount?.name}
  from={periodBounds.from}
  to={periodBounds.to} />
{/key}

<script>
  import axios from 'axios';
  import { currentPage, link } from '../../javascripts/router.js';
  import { languagePair } from '../../javascripts/bilingual.js';
  import BilingualText from '../components/bilingual-text.svelte';
  import TrialBalanceList from './trial-balance-list.svelte';
  import TrialBalanceDrillDown from './trial-balance-drilldown.svelte';
  import { buildSubtotals } from '../../../libs/reporting/tb-subtotal.js';
  import { withAccountParents, applyExpandCollapse } from '../../../libs/reporting/tb-hierarchy.js';
  import { LANG_MODES, languagePairQuery } from '../../../libs/reporting/tb-language.js';

  export let status;

  const tabs = [
    { value: 'balance',  key: 'report_trial_balance' },
    { value: 'movement', key: 'report_trial_balance_movement' },
    { value: 'combined', key: 'report_trial_balance_combined' },
  ];

  let reportType = 'balance';
  let mode = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tb-mode')) || 'actual';
  let scenarioId = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tb-scenario')) || '';
  let scenarioOptions = [];
  $: selectedScenario = scenarioOptions.find((s) => String(s.id) === String(scenarioId)) || null;
  let monthInput = '';
  let hideZero = false;
  let accountClassFilter = new Set(); // empty = all; non-empty = keep only these
  let languageMode = 'ja-vi'; // ja | vi | ja-vi | vi-ja
  let rawLines = [];        // lines from buildSubtotals
  let withParents = [];     // rawLines + synthetic parents
  let warnings = [];
  let meta = null;
  let availableClasses = []; // [{ id, aclCode, major, middle }, ...]
  let loading = false;
  let error = null;
  let lastFetched = '';
  let expanded = new Set(); // account codes currently expanded
  let drilldown;
  let drillAccount = null;  // { code, subCode, name } | null

  $: periodBounds = (() => {
    if (!status || !status.fy) return { from: null, to: null };
    if (monthInput) {
      const [y, m] = monthInput.split('-').map(Number);
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    }
    return { from: new Date(status.fy.startDate), to: new Date(status.fy.endDate) };
  })();

  $: visibleLines = applyExpandCollapse(withParents, expanded);

  $: if (mode === 'simulation' && scenarioOptions.length === 0) {
    fetchScenarios();
  }

  $: if ($currentPage && $currentPage !== lastFetched) {
    syncFromUrl();
    lastFetched = $currentPage;
    fetchData();
  }
  $: if (status && status.fy && status.fy.term && lastFetched && !loading && rawLines.length === 0 && !error) {
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

  const onFilterChange = () => {
    pushUrl();
    fetchData();
  };

  const toggleClass = (id) => {
    // If filter is currently empty (all), clicking one makes filter = {that one}
    // (i.e. isolate to this class). Clicking again removes it from the set.
    if (accountClassFilter.size === 0) {
      accountClassFilter = new Set([id]);
    } else if (accountClassFilter.has(id)) {
      accountClassFilter.delete(id);
      accountClassFilter = new Set(accountClassFilter);
    } else {
      accountClassFilter.add(id);
      accountClassFilter = new Set(accountClassFilter);
    }
    pushUrl();
    fetchData();
  };

  const resetAll = () => {
    monthInput = '';
    hideZero = false;
    accountClassFilter = new Set();
    pushUrl();
    fetchData();
  };

  const removeChip = (key) => {
    if (key === 'month') { monthInput = ''; }
    else if (key === 'hideZero') { hideZero = false; }
    else if (key === 'lang') { languageMode = 'ja-vi'; }
    else if (key.startsWith('class:')) {
      const id = parseInt(key.slice('class:'.length), 10);
      accountClassFilter.delete(id);
      accountClassFilter = new Set(accountClassFilter);
    }
    pushUrl();
    fetchData();
  };

  const selectLangMode = (m) => {
    if (!LANG_MODES.includes(m)) return;
    languageMode = m;
    pushUrl();
    fetchData();
  };

  $: activeFilterChips = (() => {
    const chips = [];
    if (monthInput) chips.push({ key: 'month', label: `month=${monthInput}` });
    if (hideZero) chips.push({ key: 'hideZero', label: 'hideZero' });
    if (languageMode !== 'ja-vi') chips.push({ key: 'lang', label: `lang=${languageMode}` });
    for (const id of accountClassFilter) {
      const cls = availableClasses.find((c) => c.id === id);
      if (cls) chips.push({ key: `class:${id}`, label: `${cls.aclCode} ${cls.major}` });
    }
    return chips;
  })();

  const pushUrl = () => {
    const base = '/reports/trial-balance';
    const parts = [];
    if (monthInput) parts.push(monthInput);
    parts.push(reportType);
    let href = `${base}/${parts.join('/')}`;
    const qs = new URLSearchParams();
    if (hideZero) qs.set('hideZero', 'true');
    if (accountClassFilter.size > 0) qs.set('class', Array.from(accountClassFilter).join(','));
    if (languageMode !== 'ja-vi') qs.set('lang', languageMode);
    const s = qs.toString();
    if (s) href += `?${s}`;
    if (href !== $currentPage) link(href);
  };

  $: syncFiltersFromUrl = (() => {
    const path = $currentPage || '';
    const qIdx = path.indexOf('?');
    const qs = qIdx >= 0 ? path.slice(qIdx + 1) : '';
    const params = new URLSearchParams(qs);
    hideZero = params.get('hideZero') === 'true';
    const clsParam = params.get('class');
    if (clsParam) {
      accountClassFilter = new Set(clsParam.split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n)));
    } else {
      accountClassFilter = new Set();
    }
    const langParam = params.get('lang');
    if (langParam && LANG_MODES.includes(langParam)) {
      languageMode = langParam;
    } else if (!langParam) {
      languageMode = 'ja-vi';
    }
  })();

  const fetchData = async () => {
    if (mode === 'simulation') {
      await fetchSimulationData();
      return;
    }
    if (!status || !status.fy || !status.fy.term) return;
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      params.set('version', '2');
      params.set('reportType', reportType);
      if (monthInput) params.set('month', monthInput);
      if (hideZero) params.set('hideZero', 'true');
      if (accountClassFilter.size > 0) {
        params.set('accountClassIds', Array.from(accountClassFilter).join(','));
      }
      const lp = $languagePair;
      if (lp) params.set('languagePair', JSON.stringify(lp));
      const url = `/api/trial-balance?${params.toString()}`;
      const r = await axios.get(url);
      meta = r.data.meta;
      warnings = r.data.meta?.warnings || [];
      const sub = buildSubtotals(r.data.lines || []);
      rawLines = sub;
      withParents = withAccountParents(sub);
      // Derive available account classes from the lines (used for the
      // class-filter chip bar). Skip rows that lack class info (subtotals
      // and parents without classId).
      const clsMap = new Map();
      for (const l of r.data.lines || []) {
        if (l.accountClassId != null && !clsMap.has(l.accountClassId)) {
          clsMap.set(l.accountClassId, {
            id: l.accountClassId,
            aclCode: l.aclCode || '',
            major: l.major || '',
            middle: l.middle || '',
          });
        }
      }
      availableClasses = Array.from(clsMap.values()).sort((a, b) =>
        String(a.aclCode).localeCompare(String(b.aclCode))
      );
      expanded = new Set(
        sub.filter((l) => l.type === 'subAccount' && l.code)
           .map((l) => l.code)
      );
    } catch (e) {
      error = e?.response?.data?.error || e.message || 'fetch failed';
      rawLines = [];
      withParents = [];
      meta = null;
      warnings = [];
    } finally {
      loading = false;
    }
  };

  const fetchScenarios = async () => {
    try {
      const r = await axios.get('/api/simulation/scenarios');
      // Only draft/locked scenarios are selectable (no archived).
      scenarioOptions = (r.data.scenarios || []).filter((s) => s.status !== 'archived');
    } catch (e) {
      scenarioOptions = [];
    }
  };

  const fetchSimulationData = async () => {
    if (!scenarioId) {
      rawLines = []; withParents = []; meta = null; warnings = [];
      return;
    }
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      if (monthInput) params.set('month', monthInput);
      if (hideZero) params.set('hideZero', 'true');
      if (accountClassFilter.size > 0) {
        params.set('accountClassIds', Array.from(accountClassFilter).join(','));
      }
      const lp = $languagePair;
      if (lp) params.set('languagePair', JSON.stringify(lp));
      const url = `/api/simulation/scenarios/${scenarioId}/trial-balance?${params.toString()}`;
      const r = await axios.get(url);
      meta = r.data.meta;
      warnings = r.data.meta?.warnings || [];
      const sub = buildSubtotals(r.data.lines || []);
      rawLines = sub;
      withParents = withAccountParents(sub);
      const clsMap = new Map();
      for (const l of r.data.lines || []) {
        if (l.accountClassId != null && !clsMap.has(l.accountClassId)) {
          clsMap.set(l.accountClassId, {
            id: l.accountClassId, aclCode: l.aclCode || '', major: l.major || '', middle: l.middle || '',
          });
        }
      }
      availableClasses = Array.from(clsMap.values())
        .sort((a, b) => String(a.aclCode).localeCompare(String(b.aclCode)));
      expanded = new Set(sub.filter((l) => l.type === 'subAccount' && l.code).map((l) => l.code));
    } catch (e) {
      error = e?.response?.data?.message || e.message || 'fetch failed';
      rawLines = []; withParents = []; meta = null; warnings = [];
    } finally {
      loading = false;
    }
  };

  const onModeChange = () => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('tb-mode', mode);
    if (mode === 'simulation') {
      fetchScenarios().then(() => fetchData());
    } else {
      fetchData();
    }
  };

  const onScenarioChange = () => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('tb-scenario', scenarioId || '');
    fetchData();
  };

  const toggleAccount = (code) => {
    if (!code) return;
    const next = new Set(expanded);
    if (next.has(code)) next.delete(code); else next.add(code);
    expanded = next;
  };

  const expandAll = () => {
    expanded = new Set(
      rawLines.filter((l) => l.type === 'subAccount' && l.code).map((l) => l.code)
    );
  };

  const collapseAll = () => {
    expanded = new Set();
  };

  const openDrillDown = (row) => {
    if (!row) return;
    if (row.type === 'subtotal') return;  // can't drill into subtotals
    if (row.type === 'parent') {
      drillAccount = { code: row.code, subCode: null, name: row.name };
    } else if (row.type === 'subAccount') {
      drillAccount = { code: row.code, subCode: row.subCode, name: row.subName || row.name };
    } else if (row.type === 'account') {
      drillAccount = { code: row.code, subCode: null, name: row.name };
    } else {
      return;
    }
    drilldown?.open();
  };

  const formatInt = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };

  const downloadExcel = async () => {
    if (!status || !status.fy || !status.fy.term) return;
    const params = new URLSearchParams();
    params.set('version', '2');
    params.set('reportType', reportType);
    params.set('format', 'xlsx');
    if (monthInput) params.set('month', monthInput);
    const lp = $languagePair;
    if (lp) params.set('languagePair', JSON.stringify(lp));
    const url = `/api/trial-balance?${params.toString()}`;
    // Let the browser handle the download via a hidden link.
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
</script>

<style>
  .tb-sim-banner {
    background: #fde7e7;
    border: 1px solid #c00000;
    color: #900;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-weight: 600;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
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
  .tb-tabs { margin-top: 0.5rem; border-bottom: 2px solid #dee2e6; }
  .tb-tab { min-width: 9rem; color: #333; font-weight: 500; border: 1px solid transparent; border-bottom: none; background: #f8f9fa; }
  .tb-tab.active { color: #000; font-weight: 600; background: #fff; border-color: #dee2e6 #dee2e6 #fff; }
  .tb-period-label { font-weight: 500; }
  .tb-meta { font-size: 0.85rem; }
  .tb-hide-zero-label { font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; }
  .tb-class-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .tb-class-chip {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.2rem 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;
    font-size: 0.8rem; background: #fff; cursor: pointer;
  }
  .tb-class-chip-off { opacity: 0.4; }
  .tb-class-code { font-family: monospace; font-weight: 600; }
  .tb-class-name { color: #555; }
  .tb-active-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .tb-active-chip {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.15rem 0.5rem; border-radius: 1rem; background: #cfe2ff; color: #052c65;
    font-size: 0.8rem;
  }
  .tb-active-chip-x {
    border: 0; background: transparent; color: #052c65; padding: 0; margin-left: 0.2rem;
    font-size: 1.1em; line-height: 1; cursor: pointer;
  }
  .tb-lang-modes { display: flex; gap: 0.3rem; }
  .tb-lang-mode { font-family: monospace; min-width: 4.5rem; }
  .tb-warnings .tb-warning { padding: 0.4rem 0.75rem; margin-bottom: 0.4rem; font-size: 0.85rem; }
  .tb-warning-critical { background: #f8d7da; border-color: #f5c2c7; color: #842029; }
  .tb-warning-high { background: #fff3cd; border-color: #ffecb5; color: #664d03; }
  .tb-warning-medium { background: #ffe5b4; border-color: #ffd09b; color: #7a4f01; }
  .tb-warning-title { margin-left: 0.5rem; }
  .tb-warning-detail { margin-left: 0.5rem; font-family: monospace; }
</style>
