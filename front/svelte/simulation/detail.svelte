<!--
  Simulation Scenario Detail — placeholder (E2.6).

  Full 4-tab implementation lands in #235 (E2.7). This stub gives the route
  /simulation/scenarios/:id a mountable component and a back link so 2.6
  (list + create) is end-to-end navigable.
-->
{#key $currentPage}
<div class="container-fluid">
  <div class="page-title d-flex justify-content-between mt-2">
    <h1 class="page-title-bilingual">
      <BilingualText primary="シナリオ詳細" secondary="Chi tiết kịch bản" inline={true} />
    </h1>
    <button type="button" class="btn btn-sm btn-outline-secondary" on:click={back}>
      <BilingualText primary="一覧へ戻る" secondary="Về danh sách" inline={true} />
    </button>
  </div>

  <div class="sim-banner">
    <i class="bi bi-exclamation-triangle-fill"></i>
    <BilingualText
      primary="SIMULATION - NOT OFFICIAL ACCOUNTING REPORT"
      secondary="MÔ PHỎNG - KHÔNG PHẢI BÁO CÁO KẾ TOÁN CHÍNH THỨC"
      inline={true} />
  </div>

  {#if loading}
    <p class="text-muted">...</p>
  {:else if error}
    <p class="text-danger">{error}</p>
  {:else if scenario}
    <table class="table table-sm table-bordered" style="max-width: 540px">
      <tbody>
        <tr><th>名称 / Tên</th><td>{scenario.name}</td></tr>
        <tr><th>状態 / Trạng thái</th><td>{scenario.status}</td></tr>
        <tr><th>基準期 / Kỳ gốc</th><td>{scenario.baseTerm}</td></tr>
        <tr><th>予測期間 / Kỳ mô phỏng</th><td>{scenario.simPeriodFrom} → {scenario.simPeriodTo}</td></tr>
      </tbody>
    </table>
    <p class="text-muted">
      <BilingualText primary="タブUIは #235 (E2.7) で実装予定" secondary="Giao diện tab sẽ có ở #235 (E2.7)" inline={true} />
    </p>
  {/if}
</div>
{/key}

<script>
  import axios from 'axios';
  import { currentPage, link } from '../../javascripts/router.js';
  import BilingualText from '../components/bilingual-text.svelte';

  export let toast = undefined;
  export let status = undefined;

  let scenario = null;
  let loading = false;
  let error = null;
  let lastFetched = '';

  $: scenarioId = (() => {
    const m = ($currentPage || '').match(/^\/simulation\/scenarios\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

  $: if ($currentPage && $currentPage !== lastFetched && scenarioId != null) {
    lastFetched = $currentPage;
    fetchData();
  }

  const fetchData = async () => {
    if (scenarioId == null) return;
    loading = true;
    error = null;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}`);
      scenario = res.data.scenario;
    } catch (e) {
      error = e.response?.data?.message || e.message || 'fetch failed';
      scenario = null;
    } finally {
      loading = false;
    }
  };

  const back = () => link('/simulation/scenarios');
</script>

<style>
  .sim-banner {
    background: #fde7e7;
    border: 1px solid #c00000;
    color: #900;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-weight: 600;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
