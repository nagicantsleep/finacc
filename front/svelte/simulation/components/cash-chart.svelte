<script>
  import axios from 'axios';

  export let scenarioId = null;

  let months = [];
  let loading = false;
  let error = null;

  let lastId = null;
  $: if (scenarioId != null && scenarioId !== lastId) {
    lastId = scenarioId;
    fetch();
  }

  async function fetch() {
    loading = true; error = null; months = [];
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/cash-flow`);
      months = res.data.months || [];
    } catch (e) {
      error = e.response?.data?.message || 'fetch failed';
    } finally { loading = false; }
  }

  const W = 700, H = 300;
  const PAD = { top: 20, right: 30, bottom: 50, left: 70 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  let yMin = 0, yMax = 1;
  $: {
    let mn = 0, mx = 1;
    for (const m of months) {
      if (m.endingCash < mn) mn = m.endingCash;
      if (m.endingCash > mx) mx = m.endingCash;
    }
    const pad = Math.max((mx - mn) * 0.1, 1000);
    yMin = Math.min(mn, -pad);
    yMax = Math.max(mx, pad);
  }

  function y(v) { return PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }
  function cx(i) {
    return months.length > 1 ? PAD.left + i * (plotW / (months.length - 1)) : PAD.left + plotW / 2;
  }
  function fmt(n) { return (Math.abs(n) / 1000).toFixed(0) + 'k'; }

  $: linePoints = months.map((m, i) => cx(i) + ',' + y(m.endingCash)).join(' ');
  $: areaPoints = months.length > 1
    ? cx(0) + ',' + y(0) + ' ' + linePoints + ' ' + cx(months.length - 1) + ',' + y(0)
    : '';
</script>

{#if loading}
  <p class="text-muted text-center py-4">...</p>
{:else if error}
  <p class="text-danger">{error}</p>
{:else if months.length === 0}
  <p class="text-muted text-center py-4">No cash data</p>
{:else}
  <svg viewBox="0 0 {W} {H}" width="100%" style="max-width:700px;">
    <line x1={PAD.left} y1={y(0)} x2={PAD.left + plotW} y2={y(0)} stroke="#aaa" stroke-dasharray="6,3" />
    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#ccc" />
    <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#ccc" />

    {#each [0, 0.25, 0.5, 0.75, 1] as pct}
      <line x1={PAD.left} y1={PAD.top + pct * plotH} x2={PAD.left + plotW} y2={PAD.top + pct * plotH} stroke="#eee" stroke-dasharray="4,4" />
      <text x={PAD.left - 5} y={PAD.top + pct * plotH + 4} text-anchor="end" font-size="10" fill="#888">{fmt(yMin + pct * (yMax - yMin))}</text>
    {/each}

    {#if months.length > 1}
      <polygon points={areaPoints} fill="rgba(13,110,253,0.08)" />
      <polyline points={linePoints} fill="none" stroke="#0d6efd" stroke-width="2.5" stroke-linejoin="round" />
    {/if}

    {#each months as m, i}
      <circle cx={cx(i)} cy={y(m.endingCash)} r="4" fill={m.endingCash < 0 ? '#dc3545' : '#0d6efd'} stroke="#fff" stroke-width="2" />
      <text x={cx(i)} y={y(m.endingCash) - 8} text-anchor="middle" font-size="9" fill={m.endingCash < 0 ? '#c00000' : '#333'}>{fmt(m.endingCash)}</text>
      <text x={cx(i)} y={PAD.top + plotH + 16} text-anchor="middle" font-size="10" fill="#666" transform="rotate(-25, {cx(i)}, {PAD.top + plotH + 16})">{m.month.substring(5)}</text>
    {/each}
  </svg>

  <table class="table table-sm table-bordered mt-2" style="font-size:0.85rem">
    <thead class="table-light">
      <tr><th>Month</th><th class="text-end">Cash In</th><th class="text-end">Cash Out</th><th class="text-end">Net Flow</th><th class="text-end">Ending Cash</th></tr>
    </thead>
    <tbody>
      {#each months as m}
        <tr>
          <td>{m.month}</td>
          <td class="text-end">{m.cashIn.toLocaleString()}</td>
          <td class="text-end">{m.cashOut.toLocaleString()}</td>
          <td class="text-end" style="color:{m.netFlow >= 0 ? '#0a7d28' : '#c00000'}">{m.netFlow.toLocaleString()}</td>
          <td class="text-end fw-bold" style="color:{m.endingCash < 0 ? '#c00000' : '#333'}">{m.endingCash.toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
