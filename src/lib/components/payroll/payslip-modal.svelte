<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let slip = null;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function formatCurrency(val) {
    if (!val && val !== 0) return '0';
    return Number(val).toLocaleString();
  }
</script>

{#if isOpen && slip}
<div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1050;">
  <div class="modal-dialog modal-lg">
    <div class="modal-content shadow-lg border-0">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title d-flex align-items-center gap-2">
          <Icon icon="bi:file-earmark-person" />
          <BilingualText key="payslip" stacked={false} />: {slip.member?.user?.legalName || slip.member?.tradingName}
        </h5>
        <button type="button" class="btn-close btn-close-white" on:click={close}></button>
      </div>

      <div class="modal-body p-4 payslip-body">
        <!-- Header Info -->
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div>
            <h5 class="fw-bold mb-0 text-primary">HIERONYMUS ACCOUNTING ERP</h5>
            <div class="text-muted small">Phiếu Lương & Thu Nhập Chi Tiết</div>
          </div>
          <div class="text-end">
            <div class="badge bg-light text-dark border fs-6 font-monospace">
              Kỳ: {slip.period?.year || '2026'} 年 {slip.period?.month || '8'} 月
            </div>
            <div class="text-muted small mt-1">Ngày công: {slip.workingDays || 0} | Giờ làm: {slip.workHours || 0}h</div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Earnings Table -->
          <div class="col-md-6 border-end">
            <h6 class="fw-bold text-success border-bottom pb-1 mb-2">1. CÁC KHOẢN THU NHẬP (EARNINGS)</h6>
            <table class="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <td class="text-muted">Lương cơ bản:</td>
                  <td class="text-end fw-bold">{formatCurrency(slip.basePay)} đ</td>
                </tr>
                <tr>
                  <td class="text-muted">Làm thêm giờ (OT {slip.overtimeHours || 0}h):</td>
                  <td class="text-end fw-bold">{formatCurrency(slip.overtimePay)} đ</td>
                </tr>
                {#if slip.allowancesDetail}
                  {#each Object.entries(slip.allowancesDetail) as [k, v]}
                    <tr>
                      <td class="text-muted">{k}:</td>
                      <td class="text-end fw-bold">{formatCurrency(v)} đ</td>
                    </tr>
                  {/each}
                {/if}
                <tr class="border-top">
                  <td class="fw-bold text-success"><BilingualText key="gross_pay" stacked={false} />:</td>
                  <td class="text-end fw-bold text-success fs-6">{formatCurrency(slip.grossPay)} đ</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Deductions Table -->
          <div class="col-md-6">
            <h6 class="fw-bold text-danger border-bottom pb-1 mb-2">2. CÁC KHOẢN TRÍCH NỘP & KHẤU TRỪ</h6>
            <table class="table table-sm table-borderless mb-0">
              <tbody>
                {#if slip.deductionsDetail}
                  {#each Object.entries(slip.deductionsDetail) as [k, v]}
                    <tr>
                      <td class="text-muted">{k}:</td>
                      <td class="text-end fw-bold text-danger">-{formatCurrency(v)} đ</td>
                    </tr>
                  {/each}
                {/if}
                <tr class="border-top">
                  <td class="fw-bold text-danger"><BilingualText key="total_deductions" stacked={false} />:</td>
                  <td class="text-end fw-bold text-danger fs-6">-{formatCurrency(slip.deductionsTotal)} đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Take Home Box -->
        <div class="p-3 bg-light rounded border mt-4 text-center">
          <div class="small text-muted text-uppercase fw-bold"><BilingualText key="net_pay" stacked={false} /></div>
          <div class="display-6 fw-bold text-primary font-monospace">{formatCurrency(slip.netPay)} đ</div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-outline-secondary" on:click={() => window.print()}>
          <Icon icon="bi:printer" class="me-1" /> In Phiếu Lương
        </button>
        <button type="button" class="btn btn-secondary" on:click={close}>
          <BilingualText key="close" stacked={false} />
        </button>
      </div>
    </div>
  </div>
</div>
{/if}
