<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '../components/bilingual-text.svelte';

  const dispatch = createEventDispatcher();

  let periods = [];
  let loading = false;
  let errorMsg = '';

  let newYear = new Date().getFullYear();
  let newMonth = new Date().getMonth() + 1;
  let creating = false;

  onMount(() => {
    loadPeriods();
  });

  export async function loadPeriods() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get('/api/payroll/periods');
      periods = res.data.periods || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function createPeriod() {
    creating = true;
    errorMsg = '';
    try {
      await axios.post('/api/payroll/periods', {
        year: parseInt(newYear, 10),
        month: parseInt(newMonth, 10)
      });
      loadPeriods();
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      creating = false;
    }
  }

  function selectPeriod(p) {
    dispatch('selectPeriod', { period: p });
  }

  function formatCurrency(val) {
    if (!val && val !== 0) return '0';
    return Number(val).toLocaleString();
  }
</script>

<div class="container-fluid py-3">
  <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
      <h4 class="fw-bold mb-1 d-flex align-items-center gap-2">
        <Icon icon="bi:wallet2" class="text-primary" />
        <BilingualText key="payroll_management" />
      </h4>
      <div class="text-muted small">
        <BilingualText key="payroll_desc" />
      </div>
    </div>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-primary d-flex align-items-center gap-1 shadow-sm" on:click={() => dispatch('openFormula')}>
        <Icon icon="bi:sliders" />
        <BilingualText key="salary_formula_setup" stacked={false} />
      </button>
    </div>
  </div>

  <!-- Create New Period Bar -->
  <div class="card shadow-sm border-0 mb-4 p-3 bg-light">
    <div class="d-flex flex-wrap align-items-center gap-3">
      <span class="fw-bold text-primary d-flex align-items-center gap-1">
        <Icon icon="bi:plus-circle" /> Khởi tạo Kỳ Lương Mới:
      </span>
      <div class="d-flex align-items-center gap-2">
        <label class="small text-muted">Năm:</label>
        <input type="number" class="form-control form-control-sm" style="width: 90px;" bind:value={newYear}>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="small text-muted">Tháng:</label>
        <select class="form-select form-select-sm" style="width: 80px;" bind:value={newMonth}>
          {#each Array.from({length: 12}, (_, i) => i + 1) as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </div>
      <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" on:click={createPeriod} disabled={creating}>
        <Icon icon="bi:plus-lg" /> Mở Kỳ Lương
      </button>
    </div>
  </div>

  {#if errorMsg}
    <div class="alert alert-danger">{errorMsg}</div>
  {/if}

  {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <div class="mt-2 text-muted">Đang tải danh sách kỳ lương...</div>
    </div>
  {:else if periods.length === 0}
    <div class="card shadow-sm border-0 text-center py-5">
      <div class="card-body">
        <Icon icon="bi:calendar-plus" style="font-size: 3.5rem;" class="text-primary mb-3" />
        <h5 class="fw-bold">Chưa có Kỳ Lương nào</h5>
        <p class="text-muted mb-4">Vui lòng chọn năm và tháng ở trên để khởi tạo kỳ tính lương đầu tiên.</p>
      </div>
    </div>
  {:else}
    <div class="row g-3">
      {#each periods as p (p.id)}
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm border-0 hover-shadow transition-all">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 class="fw-bold mb-0 text-primary font-monospace">{p.year} 年 {p.month} 月</h5>
                  <span class="small text-muted">{p.startDate} ~ {p.endDate}</span>
                </div>
                <span class="badge {p.status === 'approved' ? 'bg-success' : 'bg-primary'}">
                  {p.status}
                </span>
              </div>

              <div class="my-3 p-2 bg-light rounded border">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted"><BilingualText key="gross_pay" stacked={false} />:</span>
                  <span class="fw-bold">{formatCurrency(p.totalGrossPay)} đ</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted"><BilingualText key="total_deductions" stacked={false} />:</span>
                  <span class="text-danger fw-bold">-{formatCurrency(p.totalDeductions)} đ</span>
                </div>
                <div class="d-flex justify-content-between small border-top pt-1">
                  <span class="fw-bold text-success"><BilingualText key="net_pay" stacked={false} />:</span>
                  <span class="fw-bold text-success fs-6">{formatCurrency(p.totalNetPay)} đ</span>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                <span class="badge bg-light text-secondary border">
                  {p.slipCount || 0} phiếu lương
                </span>
                <button class="btn btn-sm btn-primary d-flex align-items-center gap-1" on:click={() => selectPeriod(p)}>
                  Chi tiết & Tính Lương <Icon icon="bi:arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
  .hover-shadow:hover {
    transform: translateY(-3px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
  }
</style>
