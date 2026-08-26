<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '../components/bilingual-text.svelte';

  export let period = null;

  const dispatch = createEventDispatcher();

  let slips = [];
  let loading = false;
  let calculating = false;
  let creatingVoucher = false;
  let errorMsg = '';
  let successMsg = '';

  let currentLoadedPeriodId = null;

  $: if (period && period.id !== currentLoadedPeriodId) {
    currentLoadedPeriodId = period.id;
    loadSlips();
  }

  export async function loadSlips() {
    if (!period) return;
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get(`/api/payroll/periods/${period.id}/slips`);
      slips = res.data.slips || [];
      if (res.data.period) {
        period.totalGrossPay = res.data.period.totalGrossPay;
        period.totalDeductions = res.data.period.totalDeductions;
        period.totalNetPay = res.data.period.totalNetPay;
        period.status = res.data.period.status;
        period.crossSlipId = res.data.period.crossSlipId;
      }
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function handleCalculate() {
    calculating = true;
    errorMsg = '';
    successMsg = '';
    try {
      const res = await axios.post(`/api/payroll/periods/${period.id}/calculate`);
      slips = res.data.slips || [];
      period = res.data.period || period;
      successMsg = 'Đã tính toán xong bảng lương cho toàn bộ nhân sự.';
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      calculating = false;
    }
  }

  async function handleApprove() {
    try {
      const res = await axios.post(`/api/payroll/periods/${period.id}/approve`);
      period = res.data.period;
      successMsg = 'Kỳ lương đã được phê duyệt thành công.';
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    }
  }

  async function handleCreateVoucher() {
    creatingVoucher = true;
    errorMsg = '';
    successMsg = '';
    try {
      const res = await axios.post(`/api/payroll/periods/${period.id}/create-voucher`);
      period.crossSlipId = res.data.crossSlipId;
      successMsg = res.data.message;
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      creatingVoucher = false;
    }
  }

  function exportCsv() {
    if (!period) return;
    window.open(`/api/payroll/periods/${period.id}/export`, '_blank');
  }

  function openPayslip(slip) {
    dispatch('viewSlip', { slip });
  }

  function formatCurrency(val) {
    if (!val && val !== 0) return '0';
    return Number(val).toLocaleString();
  }
</script>

<div class="card shadow-sm border-0">
  <div class="card-header bg-white py-3 border-bottom">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" on:click={() => dispatch('back')}>
          <Icon icon="bi:arrow-left" /> Quay lại danh sách
        </button>
        <h5 class="mb-0 fw-bold d-flex align-items-center gap-2 text-dark font-monospace">
          <Icon icon="bi:calendar-range" class="text-primary" />
          <span>Kỳ Lương {period?.year} 年 {period?.month} 月</span>
          <span class="badge {period?.status === 'approved' ? 'bg-success' : 'bg-primary'} small">
            {period?.status}
          </span>
          {#if period?.crossSlipId}
            <span class="badge bg-info text-dark small d-flex align-items-center gap-1">
              <Icon icon="bi:receipt" />
              <BilingualText key="accounting_voucher_created" stacked={false} /> (Slip #{period.crossSlipId})
            </span>
          {/if}
        </h5>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" on:click={exportCsv}>
          <Icon icon="bi:file-earmark-spreadsheet" />
          <BilingualText key="registry_export_csv" stacked={false} />
        </button>

        <button
          class="btn btn-primary btn-sm d-flex align-items-center gap-1"
          on:click={handleCalculate}
          disabled={calculating || period?.status === 'approved'}
        >
          <Icon icon="bi:calculator" />
          <BilingualText key="payroll_run" stacked={false} />
        </button>

        {#if period?.status === 'calculated'}
          <button class="btn btn-success btn-sm d-flex align-items-center gap-1" on:click={handleApprove}>
            <Icon icon="bi:check2-circle" />
            <BilingualText key="approve" stacked={false} />
          </button>
        {/if}

        {#if (period?.status === 'approved' || period?.status === 'calculated') && !period?.crossSlipId}
          <button
            class="btn btn-warning text-dark btn-sm d-flex align-items-center gap-1 fw-bold shadow-sm"
            on:click={handleCreateVoucher}
            disabled={creatingVoucher}
          >
            <Icon icon="bi:journal-plus" />
            <BilingualText key="accounting_voucher_create" stacked={false} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Period KPI Badges -->
    <div class="row g-2 mt-2 pt-2 border-top">
      <div class="col-md-4">
        <div class="p-2 bg-light rounded border text-center">
          <span class="small text-muted d-block"><BilingualText key="gross_pay" stacked={false} /></span>
          <span class="fw-bold fs-6 text-primary">{formatCurrency(period?.totalGrossPay)} đ</span>
        </div>
      </div>
      <div class="col-md-4">
        <div class="p-2 bg-light rounded border text-center">
          <span class="small text-muted d-block"><BilingualText key="total_deductions" stacked={false} /></span>
          <span class="fw-bold fs-6 text-danger">-{formatCurrency(period?.totalDeductions)} đ</span>
        </div>
      </div>
      <div class="col-md-4">
        <div class="p-2 bg-light rounded border text-center">
          <span class="small text-muted d-block"><BilingualText key="net_pay" stacked={false} /></span>
          <span class="fw-bold fs-6 text-success">{formatCurrency(period?.totalNetPay)} đ</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card-body p-0">
    {#if errorMsg}
      <div class="alert alert-danger m-3 py-2">{errorMsg}</div>
    {/if}
    {#if successMsg}
      <div class="alert alert-success m-3 py-2">{successMsg}</div>
    {/if}

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <div class="mt-2 text-muted">Đang tải danh sách bảng lương...</div>
      </div>
    {:else if slips.length === 0}
      <div class="text-center py-5 text-muted">
        <Icon icon="bi:calculator" style="font-size: 2.5rem;" class="mb-2" />
        <div>Chưa có dữ liệu tính lương. Nhấn "Tính lương tự động" để tổng hợp.</div>
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-hover table-striped mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>Nhân viên</th>
              <th>Ngày công</th>
              <th>Giờ làm</th>
              <th>Tăng ca (OT)</th>
              <th><BilingualText key="base_salary" stacked={false} /></th>
              <th>Tiền OT</th>
              <th>Phụ cấp</th>
              <th><BilingualText key="gross_pay" stacked={false} /></th>
              <th><BilingualText key="total_deductions" stacked={false} /></th>
              <th><BilingualText key="net_pay" stacked={false} /></th>
              <th class="text-end">Phiếu Lương</th>
            </tr>
          </thead>
          <tbody>
            {#each slips as s (s.id)}
              <tr>
                <td class="fw-semibold text-primary">
                  {s.member?.user?.legalName || s.member?.tradingName || `Member #${s.tenantMemberId}`}
                </td>
                <td>{s.workingDays} d</td>
                <td>{s.workHours} h</td>
                <td>{s.overtimeHours > 0 ? `+${s.overtimeHours} h` : '-'}</td>
                <td>{formatCurrency(s.basePay)} đ</td>
                <td class="text-danger">{formatCurrency(s.overtimePay)} đ</td>
                <td>{formatCurrency(s.allowancesTotal)} đ</td>
                <td class="fw-bold">{formatCurrency(s.grossPay)} đ</td>
                <td class="text-danger">-{formatCurrency(s.deductionsTotal)} đ</td>
                <td class="fw-bold text-success fs-6">{formatCurrency(s.netPay)} đ</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary py-0 px-2 d-inline-flex align-items-center gap-1" on:click={() => openPayslip(s)}>
                    <Icon icon="bi:eye" /> Xem
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
