<!--
  ComparisonTab — Issue #237 (E2.9).

  Renders the comparison report (actual / adjustment / simulated / diff / diff%)
  for a scenario. Diff colour rule:
    difference > 0 → green (tăng)
    difference < 0 → red   (giảm)
    difference = 0 → neutral
  Adds a totals row and a hideZero filter on top of the basic table that
  E2.7 embedded inline. Bilingual headers.

  Props:
    scenarioId   number
    reportType   'balance' | 'movement' | 'combined'
    status       app status (for scenario state)
-->
<div class="cmp-wrap">
  <div class="cmp-toolbar">
    <label class="cmp-hide-zero">
      <input type="checkbox" bind:checked={hideZero} />
      <BilingualText primary="差異ゼロを非表示" secondary="Ẩn dòng chênh lệch 0" inline={true} />
    </label>
    <span class="cmp-meta" role="status">
      {#if loading}<span class="text-muted">...</span>
      {:else if error}<span class="text-danger">{error}</span>
      {:else if scenarioStatus === 'archived'}<span class="badge bg-secondary">ARCHIVED</span>
      {/if}
    </span>
  </div>

  {#each warnings as w (w.code)}
    <div class="alert cmp-warning py-1" role="alert">
      <strong>[{w.code}]</strong> {w.message}
    </div>
  {/each}

  <table class="table table-bordered table-sm cmp-table">
    <thead class="table-light">
      <tr>
        <th>科目 / Mã</th>
        <th>名称 / Tên</th>
        <th class="cmp-num">実績 / Thực tế</th>
        <th class="cmp-num">調整 / Điều chỉnh</th>
        <th class="cmp-num">予測 / Mô phỏng</th>
        <th class="cmp-num">差異 / Chênh lệch</th>
        <th class="cmp-num">差異% / %</th>
      </tr>
    </thead>
    <tbody>
      {#each visibleLines as l (l.code + ':' + (l.subCode || ''))}
        <tr class:cmp-subtotal={l.type === 'subtotal'}>
          <td class="cmp-code">
            {#if l.type === 'subtotal'}【{l.major || ''}】{:else}{l.code}{#if l.subCode}-{l.subCode}{/if}{/if}
          </td>
          <td>{displayName(l)}</td>
          <td class="cmp-num">{fmtNum(l.actual.endingBalance)}</td>
          <td class="cmp-num" class:cmp-up={l.adjustment.endingBalance > 0} class:cmp-down={l.adjustment.endingBalance < 0}>
            {fmtNum(l.adjustment.endingBalance)}
          </td>
          <td class="cmp-num">{fmtNum(l.simulated.endingBalance)}</td>
          <td class="cmp-num" class:cmp-up={l.difference > 0} class:cmp-down={l.difference < 0}>
            {fmtNum(l.difference)}
          </td>
          <td class="cmp-num">{l.differencePct == null ? '—' : l.differencePct.toFixed(1) + '%'}</td>
        </tr>
      {/each}
      {#if visibleLines.length === 0 && !loading}
        <tr><td colspan="7" class="text-center text-muted py-3">データなし / Không có dữ liệu</td></tr>
      {/if}
    </tbody>
    {#if totals}
      <tfoot>
        <tr class="cmp-totals">
          <td colspan="2"><strong>合計 / Tổng</strong></td>
          <td class="cmp-num">{fmtNum(totals.actual.endingBalance)}</td>
          <td class="cmp-num" class:cmp-up={totals.difference.endingBalance > 0} class:cmp-down={totals.difference.endingBalance < 0}>
            {fmtNum(totals.difference.endingBalance)}
          </td>
          <td class="cmp-num">{fmtNum(totals.simulated.endingBalance)}</td>
          <td class="cmp-num" class:cmp-up={totals.difference.endingBalance > 0} class:cmp-down={totals.difference.endingBalance < 0}>
            {fmtNum(totals.difference.endingBalance)}
          </td>
          <td class="cmp-num"></td>
        </tr>
      </tfoot>
    {/if}
  </table>
</div>

<script>
  import axios from 'axios';
  import { languagePair } from '../../../javascripts/bilingual.js';
  import BilingualText from '../../components/bilingual-text.svelte';

  export let scenarioId = null;
  export let reportType = 'combined';

  let lines = [];
  let totals = null;
  let warnings = [];
  let scenarioStatus = null;
  let loading = false;
  let error = null;
  let loadedFor = null;
  let hideZero = false;

  $: if (scenarioId != null && scenarioId !== loadedFor) {
    loadedFor = scenarioId;
    fetchCmp();
  }

  $: visibleLines = hideZero ? lines.filter((l) => (l.difference || 0) !== 0) : lines;

  const fmtNum = (n) => (n == null ? '' : Number(n).toLocaleString('en-US'));

  const displayName = (l) => {
    const lp = $languagePair;
    const primary = lp && lp.primary === 'vi' ? (l.nameVi || l.name) : (l.name || l.nameVi);
    return primary || l.code || '';
  };

  const fetchCmp = async () => {
    if (scenarioId == null) return;
    loading = true; error = null;
    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      const lp = $languagePair;
      if (lp) params.set('languagePair', JSON.stringify(lp));
      const r = await axios.get(`/api/simulation/scenarios/${scenarioId}/comparison?${params.toString()}`);
      lines = r.data.lines || [];
      totals = r.data.totals || null;
      warnings = r.data.warnings || [];
      scenarioStatus = r.data.meta?.scenarioStatus || null;
    } catch (e) {
      error = e.response?.data?.message || e.message || 'fetch failed';
      lines = []; totals = null; warnings = [];
    } finally { loading = false; }
  };
</script>

<style>
  .cmp-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .cmp-hide-zero { font-size: 0.85rem; margin: 0; }
  .cmp-table { font-size: 0.9rem; }
  .cmp-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .cmp-code { font-family: monospace; white-space: nowrap; }
  .cmp-up { color: #0a7d28; }
  .cmp-down { color: #c00000; }
  .cmp-subtotal { background: #f3f3f3; font-weight: 600; }
  .cmp-totals { background: #eef3f8; font-weight: 600; border-top: 2px solid #ccc; }
  .cmp-warning { background: #fff3cd; border: 1px solid #ffe69c; color: #664d03; }
</style>
