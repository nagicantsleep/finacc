<!--
  Simulation Scenarios — Issue #234 (E2.6).

  List + create form for SimulationScenario. Bilingual (BilingualText).
  Filters: status, owner, date range. Create form validates periods client-side
  before POST /api/simulation/scenarios.

  Routed at /simulation/scenarios (SPA fallback renders index.spy; the SPA
  router matches /^\/simulation/ → this component).
-->
{#key $currentPage}
<div class="container-fluid">
  <div class="page-title d-flex justify-content-between mt-2">
    <h1 class="page-title-bilingual">
      <BilingualText primary="シミュレーション" secondary="Mô phỏng" inline={true} />
    </h1>
    <div>
      <button type="button" class="btn btn-primary btn-bilingual"
        on:click={openCreate}>
        <BilingualText primary="新規作成" secondary="Tạo mới" inline={true} />
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>
  </div>

  <div class="sim-banner">
    <i class="bi bi-exclamation-triangle-fill"></i>
    <BilingualText
      primary="SIMULATION - 正式な会計報告ではありません"
      secondary="MÔ PHỎNG - KHÔNG PHẢI BÁO CÁO KẾ TOÁN CHÍNH THỨC"
      inline={true} />
  </div>

  <div class="row page-subtitle align-items-center mt-2 g-2">
    <div class="col-md-auto">
      <label class="sim-filter-label">
        <BilingualText primary="状態" secondary="Trạng thái" inline={true} />:
      </label>
    </div>
    <div class="col-md-auto">
      <select class="form-select form-select-sm" bind:value={filterStatus} on:change={fetchData}>
        <option value="">すべて / Tất cả</option>
        <option value="draft">下書き / Nháp</option>
        <option value="locked">ロック / Đã khóa</option>
        <option value="archived">アーカイブ / Lưu trữ</option>
      </select>
    </div>
    <div class="col-md-auto">
      <label class="sim-filter-label">
        <BilingualText primary="期間" secondary="Từ — Đến" inline={true} />:
      </label>
    </div>
    <div class="col-md-auto">
      <input type="date" class="form-control form-control-sm" bind:value={filterFrom} on:change={fetchData} />
    </div>
    <div class="col-md-auto">
      <input type="date" class="form-control form-control-sm" bind:value={filterTo} on:change={fetchData} />
    </div>
    <div class="col-md-auto">
      <button type="button" class="btn btn-sm btn-outline-secondary" on:click={resetFilters}>
        <BilingualText primary="リセット" secondary="Đặt lại" inline={true} />
      </button>
    </div>
    <div class="col-md-auto sim-meta" role="status">
      {#if loading}<span class="text-muted">...</span>
      {:else if error}<span class="text-danger">{error}</span>
      {:else}<span class="text-muted">{scenarios.length} 件 / mục</span>{/if}
    </div>
  </div>

  <table class="table table-bordered table-sm sim-table mt-2">
    <thead class="table-light">
      <tr>
        <th scope="col">名称 / Tên</th>
        <th scope="col" class="sim-col-status">状態 / Trạng thái</th>
        <th scope="col" class="sim-col-num">基準期 / Kỳ gốc</th>
        <th scope="col">予測期間 / Kỳ mô phỏng</th>
        <th scope="col" class="sim-col-date">作成日 / Ngày tạo</th>
      </tr>
    </thead>
    <tbody>
      {#each scenarios as s (s.id)}
        <tr class="sim-clickable" on:click={() => openDetail(s.id)}>
          <td>
            <strong>{s.name}</strong>
            {#if s.description}<div class="sim-desc">{s.description}</div>{/if}
          </td>
          <td class="sim-col-status">
            <span class="badge sim-badge-{s.status}">{statusLabel(s.status)}</span>
          </td>
          <td class="sim-col-num">{s.baseTerm}</td>
          <td>{fmtDate(s.simPeriodFrom)} → {fmtDate(s.simPeriodTo)}</td>
          <td class="sim-col-date">{fmtDate(s.createdAt)}</td>
        </tr>
      {/each}
      {#if scenarios.length === 0 && !loading}
        <tr>
          <td colspan="5" class="text-center text-muted sim-empty">
            <BilingualText primary="シナリオがありません" secondary="Chưa có kịch bản nào" inline={true} />
            <div class="mt-2">
              <button type="button" class="btn btn-sm btn-primary" on:click={openCreate}>
                <BilingualText primary="最初のシナリオを作成" secondary="Tạo kịch bản đầu tiên" inline={true} />
              </button>
            </div>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

{#if showCreate}
<div class="sim-modal-backdrop" on:click|self={closeCreate}>
  <div class="sim-modal">
    <div class="sim-modal-header">
      <h5><BilingualText primary="シナリオ作成" secondary="Tạo kịch bản" inline={true} /></h5>
      <button type="button" class="btn-close" aria-label="Close" on:click={closeCreate}></button>
    </div>
    <div class="sim-modal-body">
      {#if formError}<div class="alert alert-danger py-1">{formError}</div>{/if}
      <div class="mb-2">
        <label class="form-label sim-form-label">名称 / Tên *</label>
        <input type="text" class="form-control form-control-sm" bind:value={form.name} maxlength="200" />
      </div>
      <div class="mb-2">
        <label class="form-label sim-form-label">説明 / Mô tả</label>
        <textarea class="form-control form-control-sm" rows="2" bind:value={form.description}></textarea>
      </div>
      <div class="row g-2">
        <div class="col">
          <label class="form-label sim-form-label">基準期 / Kỳ gốc (term) *</label>
          <input type="number" class="form-control form-control-sm" bind:value={form.baseTerm} min="1" />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">公開 / Hiển thị</label>
          <select class="form-select form-select-sm" bind:value={form.visibility}>
            <option value="private">非公開 / Riêng tư</option>
            <option value="shared">共有 / Chia sẻ</option>
          </select>
        </div>
      </div>
      <div class="row g-2 mt-1">
        <div class="col">
          <label class="form-label sim-form-label">基準開始 / Gốc từ *</label>
          <input type="date" class="form-control form-control-sm" bind:value={form.basePeriodFrom} />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">基準終了 / Gốc đến *</label>
          <input type="date" class="form-control form-control-sm" bind:value={form.basePeriodTo} />
        </div>
      </div>
      <div class="row g-2 mt-1">
        <div class="col">
          <label class="form-label sim-form-label">予測開始 / Mô phỏng từ *</label>
          <input type="date" class="form-control form-control-sm" bind:value={form.simPeriodFrom} />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">予測終了 / Mô phỏng đến *</label>
          <input type="date" class="form-control form-control-sm" bind:value={form.simPeriodTo} />
        </div>
      </div>
    </div>
    <div class="sim-modal-footer">
      <button type="button" class="btn btn-sm btn-secondary" on:click={closeCreate}>
        <BilingualText primary="キャンセル" secondary="Hủy" inline={true} />
      </button>
      <button type="button" class="btn btn-sm btn-primary" on:click={submitCreate} disabled={submitting}>
        <BilingualText primary="作成" secondary="Tạo" inline={true} />
      </button>
    </div>
  </div>
</div>
{/if}
{/key}

<script>
  import axios from 'axios';
  import { currentPage, link } from '../../javascripts/router.js';
  import BilingualText from '../components/bilingual-text.svelte';

  export let toast = undefined;
  export let status = undefined;

  let scenarios = [];
  let loading = false;
  let error = null;
  let lastFetched = '';

  let filterStatus = '';
  let filterFrom = '';
  let filterTo = '';

  let showCreate = false;
  let submitting = false;
  let formError = null;
  let form = emptyForm();

  function emptyForm() {
    return {
      name: '',
      description: '',
      baseTerm: status && status.fy && status.fy.term ? status.fy.term : 1,
      visibility: 'private',
      basePeriodFrom: '',
      basePeriodTo: '',
      simPeriodFrom: '',
      simPeriodTo: '',
    };
  }

  const STATUS_LABELS = {
    draft: '下書き / Nháp',
    locked: 'ロック / Khóa',
    archived: 'アーカイブ / Lưu trữ',
  };
  const statusLabel = (s) => STATUS_LABELS[s] || s;

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
    return dt.toISOString().slice(0, 10);
  };

  $: if ($currentPage && $currentPage !== lastFetched && /^\/simulation\/scenarios\/?($|\?)/.test($currentPage)) {
    lastFetched = $currentPage;
    fetchData();
  }

  const fetchData = async () => {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);
      const qs = params.toString();
      const res = await axios.get(`/api/simulation/scenarios${qs ? `?${qs}` : ''}`);
      scenarios = res.data.scenarios || [];
    } catch (e) {
      error = e.response?.data?.message || e.message || 'fetch failed';
      scenarios = [];
    } finally {
      loading = false;
    }
  };

  const resetFilters = () => {
    filterStatus = '';
    filterFrom = '';
    filterTo = '';
    fetchData();
  };

  const openDetail = (id) => link(`/simulation/scenarios/${id}`);

  const openCreate = () => {
    form = emptyForm();
    if (status && status.fy) {
      form.basePeriodFrom = fmtDate(status.fy.startDate);
      form.basePeriodTo = fmtDate(status.fy.endDate);
    }
    formError = null;
    showCreate = true;
  };
  const closeCreate = () => { showCreate = false; };

  const validateForm = () => {
    if (!form.name || form.name.trim() === '') return 'name is required / Tên bắt buộc';
    if (form.name.length > 200) return 'name too long (max 200)';
    if (!form.basePeriodFrom || !form.basePeriodTo || !form.simPeriodFrom || !form.simPeriodTo) {
      return 'all periods are required / Cần đủ các kỳ';
    }
    if (form.basePeriodFrom > form.basePeriodTo) return 'basePeriodFrom must be <= basePeriodTo';
    if (form.simPeriodFrom > form.simPeriodTo) return 'simPeriodFrom must be <= simPeriodTo';
    if (form.simPeriodFrom <= form.basePeriodTo) return 'simPeriodFrom must be after basePeriodTo';
    return null;
  };

  const submitCreate = async () => {
    formError = validateForm();
    if (formError) return;
    submitting = true;
    try {
      const res = await axios.post('/api/simulation/scenarios', form);
      showCreate = false;
      if (toast) toast.show('作成しました / Đã tạo');
      await fetchData();
      if (res.data.scenario && res.data.scenario.id) {
        link(`/simulation/scenarios/${res.data.scenario.id}`);
      }
    } catch (e) {
      formError = e.response?.data?.message || e.message || 'create failed';
    } finally {
      submitting = false;
    }
  };
</script>

<style>
  .sim-banner {
    background: #fde7e7;
    border: 1px solid #c00000;
    color: #900;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sim-table { font-size: 0.9rem; }
  .sim-col-status { width: 9rem; }
  .sim-col-num { text-align: right; width: 6rem; }
  .sim-col-date { width: 8rem; white-space: nowrap; }
  .sim-clickable { cursor: pointer; }
  .sim-clickable:hover { background: #f0f6ff; }
  .sim-desc { font-size: 0.8em; color: #777; }
  .sim-empty { padding: 2rem; }
  .sim-filter-label { font-size: 0.85rem; margin: 0; }
  .sim-form-label { font-size: 0.8rem; margin-bottom: 0.1rem; }
  .badge.sim-badge-draft { background: #6c757d; }
  .badge.sim-badge-locked { background: #0d6efd; }
  .badge.sim-badge-archived { background: #adb5bd; color: #333; }

  .sim-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 1050;
  }
  .sim-modal {
    background: #fff; border-radius: 6px; width: 90%; max-width: 540px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .sim-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem 1rem; border-bottom: 1px solid #eee;
  }
  .sim-modal-header h5 { margin: 0; }
  .sim-modal-body { padding: 1rem; max-height: 70vh; overflow-y: auto; }
  .sim-modal-footer {
    display: flex; justify-content: flex-end; gap: 0.5rem;
    padding: 0.75rem 1rem; border-top: 1px solid #eee;
  }
</style>
