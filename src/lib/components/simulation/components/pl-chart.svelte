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
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/pl`);
      months = res.data.months || [];
    } catch (e) {
      error = e.response?.data?.message || 'fetch failed';
    } finally { loading = false; }
  }

  const W = 700, H = 320, PAD = { top: 20, right: 30, bottom: 50, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  let maxVal = 1;
  $: {
    let mv = 1;
    for (const m of months) {
      mv = Math.max(mv, m.revenue || 0, m.expense || 0);
    }
    maxVal = mv;
  }

  $: barW = Math.max(plotW / Math.max(months.length, 1) * 0.35, 8);
  $: barPad = plotW / Math.max(months.length, 1);

  function y(v) { return PAD.top + plotH - (v / maxVal) * plotH; }
  function cx(i) { return PAD.left + (i + 0.5) * barPad; }
  function fmt(n) { return (n / 1000).toFixed(0) + 'k'; }
</script>

{#if loading}
  <p class="text-muted text-center py-4">...</p>
{:else if error}
  <p class="text-danger">{error}</p>
{:else if months.length === 0}
  <p class="text-muted text-center py-4">No P/L data</p>
{:else}
  <svg viewBox="0 0 {W} {H}" width="100%" style="max-width:700px;">
    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#ccc" />
    <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#ccc" />

    {#each [0, 0.25, 0.5, 0.75, 1] as pct}
      <line x1={PAD.left} y1={PAD.top + plotH - pct * plotH} x2={PAD.left + plotW} y2={PAD.top + plotH - pct * plotH} stroke="#eee" stroke-dasharray="4,4" />
      <text x={PAD.left - 5} y={PAD.top + plotH - pct * plotH + 4} text-anchor="end" font-size="10" fill="#888">{fmt(maxVal * pct)}</text>
    {/each}

    {#each months as m, i}
      <rect x={cx(i) - barW} y={y(m.revenue)} width={barW} height={plotH - (y(m.revenue) - PAD.top)} fill="#0d6efd" rx="1" />
      <rect x={cx(i)} y={y(m.expense)} width={barW} height={plotH - (y(m.expense) - PAD.top)} fill="#dc3545" rx="1" />
      <text x={cx(i)} y={PAD.top + plotH + 16} text-anchor="middle" font-size="10" fill="#666" transform="rotate(-25, {cx(i)}, {PAD.top + plotH + 16})">{m.month.substring(5)}</text>
      <text x={cx(i)} y={y(Math.max(m.netIncome, 0)) - 4} text-anchor="middle" font-size="9" fill={m.netIncome >= 0 ? '#0a7d28' : '#c00000'}>
        {m.netIncome >= 0 ? '+' : ''}{fmt(Math.abs(m.netIncome))}
      </text>
    {/each}

    <rect x={PAD.left + plotW - 180} y={PAD.top} width={12} height={12} rx="2" fill="#0d6efd" />
    <text x={PAD.left + plotW - 165} y={PAD.top + 10} font-size="10" fill="#333">Revenue</text>
    <rect x={PAD.left + plotW - 100} y={PAD.top} width={12} height={12} rx="2" fill="#dc3545" />
    <text x={PAD.left + plotW - 85} y={PAD.top + 10} font-size="10" fill="#333">Expense</text>
  </svg>

  <table class="table table-sm table-bordered mt-2" style="font-size:0.85rem">
    <thead class="table-light">
      <tr>
        <th>Month</th>
        <th class="text-end">Revenue</th>
        <th class="text-end">Expense</th>
        <th class="text-end">Net Income</th>
      </tr>
    </thead>
    <tbody>
      {#each months as m}
        <tr>
          <td>{m.month}</td>
          <td class="text-end">{m.revenue.toLocaleString()}</td>
          <td class="text-end">{m.expense.toLocaleString()}</td>
          <td class="text-end" style="color:{m.netIncome >= 0 ? '#0a7d28' : '#c00000'}">{m.netIncome.toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
