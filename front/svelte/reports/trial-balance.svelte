<!--
  Trial Balance v2 — Issue #209 (E1.3) + #210 (E1.4).

  3 tabs (balance/movement/combined), bilingual header, period selector,
  5-level hierarchy with per-account expand/collapse (E1.4).

  Out of scope: drill-down modal (E1.5), warnings banner (E1.6),
  export (E1.7), full filter UI (E1.8), bilingual mode selector (E1.9),
  legacy remove (E1.10).
-->
{#key $currentPage}
<div class="tb-page">
  {#if mode === 'simulation'}
    <div class="tb-sim-banner">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>
        SIMULATION - NOT OFFICIAL ACCOUNTING REPORT
        {#if selectedScenario} · {selectedScenario.name} ({selectedScenario.status}){/if}
      </span>
    </div>
  {/if}

  <header class="tb-chrome">
    <div class="tb-header-row">
      <h1 class="tb-title page-title-bilingual">
        <BilingualText key="trial_balance_v2" inline={true} />
      </h1>
      <ul class="nav tb-tabs" role="tablist">
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
      <button type="button" class="btn btn-primary btn-sm btn-bilingual tb-export-btn"
        on:click={downloadExcel}
        disabled={loading || exporting || !status?.fy?.term || mode === 'simulation'}
        title={mode === 'simulation' ? 'Simulation export is not available here' : ''}>
        <BilingualText primary="Excel出力" secondary="Xuất Excel" inline={true} />
        <i class="bi bi-download"></i>
      </button>
    </div>

    <div class="tb-controls">
      <div class="tb-control">
        <label class="tb-period-label">
          <BilingualText primary="モード" secondary="Chế độ" inline={true} />:
        </label>
        <select class="form-select form-select-sm tb-select-mode" bind:value={mode} on:change={onModeChange}>
          <option value="actual">実績 / Thực tế</option>
          <option value="simulation">シミュレーション / Mô phỏng</option>
        </select>
      </div>
      {#if mode === 'simulation'}
        <div class="tb-control">
          <select class="form-select form-select-sm tb-select-scenario" bind:value={scenarioId} on:change={onScenarioChange}>
            <option value="">-- シナリオ選択 / Chọn kịch bản --</option>
            {#each scenarioOptions as s (s.id)}
              <option value={s.id}>{s.name} ({s.status})</option>
            {/each}
          </select>
        </div>
      {/if}
      <div class="tb-control">
        <label class="tb-period-label">
          <BilingualText primary="期間" secondary="Kỳ" inline={true} />:
        </label>
        <input
          type="month"
          class="form-control form-control-sm tb-month-input"
          bind:value={monthInput}
          on:change={onMonthChange} />
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary"
        on:click={resetPeriod}>
        <BilingualText primary="年度全体" secondary="Cả năm" inline={true} />
      </button>
      <label class="tb-hide-zero-label">
        <input type="checkbox" bind:checked={hideZero} on:change={onFilterChange} />
        <BilingualText primary="ゼロ非表示" secondary="Ẩn số 0" inline={true} />
      </label>
      <div class="tb-control-group">
        <button type="button" class="btn btn-sm btn-outline-secondary"
          on:click={expandAll}>
          <BilingualText primary="すべて展開" secondary="Mở rộng" inline={true} />
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary"
          on:click={collapseAll}>
          <BilingualText primary="すべて折りたたみ" secondary="Thu gọn" inline={true} />
        </button>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger"
        on:click={resetAll}>
        <BilingualText primary="フィルタをリセット" secondary="Đặt lại" inline={true} />
      </button>
      {#if availableClasses.length > 0}
        <div class="tb-control tb-class-filter">
          <label class="tb-period-label">
            <BilingualText primary="科目区分" secondary="Loại TK" inline={true} />:
          </label>
          <button type="button"
            class="btn btn-sm btn-outline-secondary tb-class-toggle"
            on:click={toggleClassDropdown}>
            <BilingualText primary="選択" secondary="Chọn" inline={true} />
            {#if accountClassFilter.size > 0}
              <span class="badge bg-primary ms-1">{accountClassFilter.size}</span>
            {/if}
            <i class="bi bi-caret-down-fill ms-1"></i>
          </button>
          {#if classDropdownOpen}
            <div class="tb-class-popover" use:clickOutside={applyClassFilter}>
              <div class="tb-class-popover-header">
                <button type="button" class="btn btn-sm btn-link p-0"
                  on:click={() => { classFilterDraft = new Set(); }}>
                  <BilingualText primary="全て" secondary="Tất cả" inline={true} />
                </button>
                <button type="button" class="btn btn-sm btn-link p-0 ms-2"
                  on:click={() => { classFilterDraft = new Set(availableClasses.map((c) => c.id)); }}>
                  <BilingualText primary="全選択" secondary="Chọn tất cả" inline={true} />
                </button>
              </div>
              <ul class="tb-class-popover-list">
                {#each availableClasses as cls (cls.id)}
                  {@const classLbl = formatClassLabel(cls)}
                  <li>
                    <label class="tb-class-option"
                      class:tb-class-option-on={classFilterDraft.has(cls.id)}>
                      <input type="checkbox"
                        checked={classFilterDraft.has(cls.id)}
                        on:change={() => toggleClassDraft(cls.id)} />
                      <span class="tb-class-code">{cls.aclCode}</span>
                      <span class="tb-class-name">
                        <span class="tb-class-ja">{classLbl.ja}</span>
                        {#if classLbl.vi}
                          <span class="tb-class-vi">{classLbl.vi}</span>
                        {/if}
                      </span>
                    </label>
                  </li>
                {/each}
              </ul>
              <div class="tb-class-popover-footer">
                <span class="tb-class-draft-count text-muted">
                  {#if classFilterDraft.size > 0}
                    {classFilterDraft.size} <BilingualText primary="件選択" secondary="đã chọn" stacked={false} />
                  {:else}
                    <BilingualText primary="すべて" secondary="Tất cả" stacked={false} />
                  {/if}
                </span>
                <button type="button" class="btn btn-sm btn-primary"
                  on:click={applyClassFilter}>
                  <BilingualText primary="適用" secondary="Áp dụng" inline={true} />
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      <div class="tb-meta" role="status">
        {#if loading}
          <span class="text-muted">...</span>
        {:else if error}
          <span class="text-danger">{error}</span>
        {:else if meta}
          <span class="text-muted tb-meta-text">
            {#if meta.period?.label}
              {meta.period.label}
            {:else}
              <BilingualText primary="年度全体" secondary="Cả năm" stacked={false} />
            {/if}
            {#if meta.totals}
              · {formatInt(meta.totals.movementDebit)} / {formatInt(meta.totals.movementCredit)}
            {/if}
          </span>
        {/if}
      </div>
    </div>

    {#if activeFilterChips.length > 0}
      <div class="tb-chips-row">
        <span class="tb-period-label">
          <BilingualText primary="適用中" secondary="Đang áp dụng" inline={true} />:
        </span>
        <div class="tb-active-chips">
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
      <div class="tb-warnings">
        {#each warnings as w (w.code + JSON.stringify(w.detail || {}))}
          <div class="alert tb-warning tb-warning-{w.severity} py-1 mb-1" role="alert">
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
  </header>

  <div class="tb-v2-table-wrap">
    <TrialBalanceList
      lines={visibleLines}
      {expanded}
      {languageMode}
      {reportType}
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
  import { LANG_MODES, languagePairQuery, pickDisplayName } from '../../../libs/reporting/tb-language.js';

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
  let availableClasses = []; // [{ id, aclCode, major, middle, minor, *Vi }, ...]
  let accountClassCatalog = new Map();
  let classFilterDraft = new Set();
  let classDropdownOpen = false;
  let loading = false;
  let exporting = false;
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

  const setsEqual = (a, b) => {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  };

  const mergeClassesFromLines = (lines) => {
    let changed = false;
    for (const l of lines || []) {
      if (l.accountClassId == null || accountClassCatalog.has(l.accountClassId)) continue;
      changed = true;
      accountClassCatalog.set(l.accountClassId, {
        id: l.accountClassId,
        aclCode: l.aclCode || '',
        major: l.major || '',
        middle: l.middle || '',
        minor: l.minor || '',
        majorVi: l.majorVi || null,
        middleVi: l.middleVi || null,
        minorVi: l.minorVi || null,
      });
    }
    if (changed) {
      accountClassCatalog = new Map(accountClassCatalog);
      availableClasses = Array.from(accountClassCatalog.values()).sort((a, b) =>
        String(a.aclCode).localeCompare(String(b.aclCode))
      );
    }
  };

  const refreshClassCatalog = async () => {
    if (!status?.fy?.term) return;
    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      if (monthInput) params.set('month', monthInput);
      const lp = $languagePair;
      if (lp) params.set('languagePair', JSON.stringify(lp));
      let url;
      if (mode === 'simulation') {
        if (!scenarioId) return;
        url = `/api/simulation/scenarios/${scenarioId}/trial-balance?${params.toString()}`;
      } else {
        params.set('version', '2');
        url = `/api/trial-balance?${params.toString()}`;
      }
      const r = await axios.get(url);
      mergeClassesFromLines(r.data.lines);
    } catch {
      /* keep existing catalog */
    }
  };

  const toggleClassDropdown = () => {
    if (classDropdownOpen) {
      applyClassFilter();
    } else {
      classFilterDraft = new Set(accountClassFilter);
      classDropdownOpen = true;
      refreshClassCatalog();
    }
  };

  const toggleClassDraft = (id) => {
    const next = new Set(classFilterDraft);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    classFilterDraft = next;
  };

  const applyClassFilter = () => {
    if (!classDropdownOpen) return;
    const next = new Set(classFilterDraft);
    const changed = !setsEqual(accountClassFilter, next);
    accountClassFilter = next;
    classDropdownOpen = false;
    if (changed) {
      pushUrl();
      fetchData();
    }
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
      if (cls) {
        const lbl = formatClassLabel(cls);
        chips.push({ key: `class:${id}`, label: `${cls.aclCode} ${lbl.ja}` });
      }
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
      mergeClassesFromLines(r.data.lines);
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
      mergeClassesFromLines(r.data.lines);
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
    if (!status?.fy?.term || mode === 'simulation' || exporting) return;
    const params = new URLSearchParams();
    params.set('format', 'xlsx');
    params.set('reportType', reportType);
    if (monthInput) params.set('month', monthInput);
    if (hideZero) params.set('hideZero', 'true');
    if (accountClassFilter.size > 0) {
      params.set('accountClassIds', Array.from(accountClassFilter).join(','));
    }
    const lp = $languagePair;
    if (lp) params.set('languagePair', JSON.stringify(lp));
    exporting = true;
    error = null;
    try {
      const r = await axios.get(`/api/trial-balance?${params.toString()}`, {
        responseType: 'blob',
      });
      const disp = r.headers['content-disposition'] || '';
      const m = /filename="([^"]+)"/.exec(disp);
      const filename = m ? m[1] : `trial_balance_${status.fy.term}.xlsx`;
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      error = e?.response?.data?.error || e?.response?.data?.message || e.message || 'export failed';
    } finally {
      exporting = false;
    }
  };

  // Render a class name (major/middle) bilingual, given the line shape from
  // availableClasses (which has major/majorVi/middle/middleVi but not name/nameVi).
  const pickClassName = (cls, level, mode) => {
    const ja = level === 'major' ? cls.major : level === 'middle' ? cls.middle : cls.minor;
    const vi = level === 'major' ? cls.majorVi : level === 'middle' ? cls.middleVi : cls.minorVi;
    return pickDisplayName({ name: ja, nameVi: vi, code: '' }, mode);
  };

  /** Single-line JA/VI path for account-class filter (大/中/小 joined). */
  const formatClassLabel = (cls) => {
    const majorDn = pickClassName(cls, 'major', 'ja-vi');
    const middleDn = pickClassName(cls, 'middle', 'ja-vi');
    const minorDn = pickClassName(cls, 'minor', 'ja-vi');
    const ja = [majorDn.primary, middleDn.primary, minorDn.primary].filter(Boolean).join(' / ');
    const vi = [majorDn.secondary, middleDn.secondary, minorDn.secondary].filter(Boolean).join(' / ') || null;
    return { ja, vi: vi && vi !== ja ? vi : null };
  };

  // Svelte action: invoke `handler` when a click occurs outside the bound node.
  function clickOutside(node, handler) {
    const onClick = (e) => {
      if (!node.contains(e.target)) handler(e);
    };
    document.addEventListener('click', onClick, true);
    return {
      destroy() { document.removeEventListener('click', onClick, true); }
    };
  }
</script>

<style>
  /* Viewport-bound page: chrome shrinks, table fills remainder and scrolls internally. */
  .tb-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--topbar-height) - 4.25rem);
    min-height: 320px;
    overflow: hidden;
    padding: 0.25rem 0 0;
  }
  .tb-chrome { flex: 0 0 auto; overflow: visible; }
  .tb-sim-banner {
    background: #fde7e7;
    border: 1px solid #c00000;
    color: #900;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.8rem;
    margin-bottom: 0.35rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .tb-header-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .tb-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    flex-shrink: 0;
  }
  .tb-tabs {
    display: flex;
    flex: 1 1 auto;
    margin: 0;
    padding: 0;
    list-style: none;
    border-bottom: 2px solid #dee2e6;
    gap: 0.1rem;
    min-width: 12rem;
  }
  .tb-tab {
    min-width: auto;
    padding: 0.3rem 0.65rem;
    font-size: 0.8125rem;
    color: #333;
    font-weight: 500;
    border: 1px solid transparent;
    border-bottom: none;
    background: #f8f9fa;
    margin: 0;
  }
  .tb-tab.active {
    color: #000;
    font-weight: 600;
    background: #fff;
    border-color: #dee2e6 #dee2e6 #fff;
  }
  .tb-export-btn {
    flex-shrink: 0;
    margin: 0 !important;
  }
  .tb-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.55rem;
    padding: 0.3rem 0;
    font-size: 0.8125rem;
    overflow: visible;
  }
  .tb-controls :global(button[type="button"]) { margin: 0; }
  .tb-control {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  .tb-control-group {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .tb-select-mode { width: 9.5rem; }
  .tb-select-scenario { width: 14rem; max-width: 18rem; }
  .tb-month-input { width: 8.5rem; }
  .tb-period-label { font-weight: 500; white-space: nowrap; margin: 0; }
  .tb-meta { font-size: 0.8rem; margin-left: auto; }
  .tb-meta-text {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.15rem;
  }
  .tb-hide-zero-label {
    font-size: 0.8125rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0;
  }
  .tb-chips-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.5rem;
    padding-bottom: 0.25rem;
    font-size: 0.8rem;
  }
  .tb-class-filter { position: relative; overflow: visible; }
  .tb-class-toggle { display: inline-flex; align-items: center; }
  .tb-class-popover {
    position: absolute; top: 100%; right: 0; left: auto; z-index: 1100;
    background: #fff; border: 1px solid #ccc; border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    width: max-content;
    min-width: 36rem;
    max-width: min(52rem, calc(100vw - 16rem));
    margin-top: 0.25rem;
  }
  .tb-class-popover-header {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.4rem 0.75rem; border-bottom: 1px solid #eee; background: #f8f9fa;
  }
  .tb-class-popover-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    border-top: 1px solid #eee;
    background: #f8f9fa;
  }
  .tb-class-draft-count { font-size: 0.8rem; }
  .tb-class-popover-list {
    list-style: none; margin: 0; padding: 0.25rem 0;
    max-height: 18rem; overflow-y: auto;
    overflow-x: auto;
  }
  .tb-class-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .tb-class-option:hover { background: #f0f6ff; }
  .tb-class-option-on { background: #e7f1ff; font-weight: 500; }
  .tb-class-code {
    font-family: monospace;
    font-weight: 600;
    min-width: 2.75rem;
    flex-shrink: 0;
  }
  .tb-class-name {
    display: inline-flex;
    flex-direction: column;
    line-height: 1.25;
    flex-shrink: 0;
  }
  .tb-class-ja { font-weight: 500; color: #333; }
  .tb-class-vi { font-size: 0.8em; color: #777; }
  .tb-v2-table-wrap {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 4px;
  }
  .tb-v2-table-wrap :global(.tb-v2-table) { margin-bottom: 0; }
  .tb-active-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .tb-active-chip {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.1rem 0.45rem; border-radius: 1rem; background: #cfe2ff; color: #052c65;
    font-size: 0.75rem;
  }
  .tb-active-chip-x {
    border: 0; background: transparent; color: #052c65; padding: 0; margin-left: 0.15rem;
    font-size: 1.1em; line-height: 1; cursor: pointer;
  }
  .tb-lang-modes { display: flex; gap: 0.3rem; }
  .tb-lang-mode { font-family: monospace; min-width: 4.5rem; }
  .tb-warnings { padding-bottom: 0.25rem; }
  .tb-warnings .tb-warning { padding: 0.25rem 0.6rem; font-size: 0.8rem; }
  .tb-warning-critical { background: #f8d7da; border-color: #f5c2c7; color: #842029; }
  .tb-warning-high { background: #fff3cd; border-color: #ffecb5; color: #664d03; }
  .tb-warning-medium { background: #ffe5b4; border-color: #ffd09b; color: #7a4f01; }
  .tb-warning-title { margin-left: 0.4rem; }
  .tb-warning-detail { margin-left: 0.4rem; font-family: monospace; }
</style>
