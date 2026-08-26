<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '../components/bilingual-text.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let advances = [];
  let projects = [];
  let loading = false;
  let submitting = false;
  let errorMsg = '';

  let title = '';
  let amount = 5000000;
  let requestDate = new Date().toISOString().split('T')[0];
  let expectedDate = '';
  let projectId = '';
  let purpose = '';

  $: if (isOpen) {
    initData();
  }

  async function initData() {
    loading = true;
    errorMsg = '';
    try {
      const [advRes, prjRes] = await Promise.all([
        axios.get('/api/expense/advances?allMembers=true'),
        axios.get('/api/projects')
      ]);
      advances = advRes.data.advances || [];
      projects = prjRes.data.projects || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function submitAdvance() {
    if (!title || !amount) {
      errorMsg = 'Vui lòng nhập tiêu đề và số tiền tạm ứng.';
      return;
    }

    submitting = true;
    errorMsg = '';
    try {
      await axios.post('/api/expense/advances', {
        title,
        amount: parseFloat(amount),
        requestDate,
        expectedDate: expectedDate || null,
        projectId: projectId ? parseInt(projectId, 10) : null,
        purpose
      });
      title = '';
      purpose = '';
      initData();
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      submitting = false;
    }
  }

  async function reviewAdvance(adv, status) {
    try {
      await axios.put(`/api/expense/advances/${adv.id}/review`, { status });
      initData();
      dispatch('updated');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  function formatCurrency(val) {
    if (!val && val !== 0) return '0';
    return Number(val).toLocaleString();
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }
</script>

{#if isOpen}
<div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1050;">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content shadow-lg">
      <div class="modal-header bg-light">
        <h5 class="modal-title d-flex align-items-center gap-2">
          <Icon icon="bi:cash-stack" class="text-primary" />
          <BilingualText key="expense_advances" stacked={false} />
        </h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <!-- Add Advance Request Form -->
        <div class="card p-3 bg-light border mb-4">
          <h6 class="fw-bold text-primary mb-3"><BilingualText key="new_expense_advance" stacked={false} /></h6>
          <div class="row g-2">
            <div class="col-md-5">
              <label class="form-label small fw-bold">Mục đích / Tiêu đề <span class="text-danger">*</span></label>
              <input type="text" class="form-control form-control-sm" placeholder="VD: Tạm ứng công tác thị trường Đà Nẵng" bind:value={title}>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Số tiền tạm ứng (VND) <span class="text-danger">*</span></label>
              <input type="number" class="form-control form-control-sm" bind:value={amount}>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold">Dự án liên quan</label>
              <select class="form-select form-select-sm" bind:value={projectId}>
                <option value="">-- Không chọn --</option>
                {#each projects as p}
                  <option value={p.id}>{p.name}</option>
                {/each}
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Ngày yêu cầu</label>
              <input type="date" class="form-control form-control-sm" bind:value={requestDate}>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold"><BilingualText key="expected_date" stacked={false} /></label>
              <input type="date" class="form-control form-control-sm" bind:value={expectedDate}>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold"><BilingualText key="advance_purpose" stacked={false} /></label>
              <input type="text" class="form-control form-control-sm" placeholder="Chi tiết lịch trình, kế hoạch sử dụng..." bind:value={purpose}>
            </div>
            <div class="col-12 text-end mt-3">
              <button class="btn btn-primary btn-sm d-flex align-items-center gap-1 ms-auto" on:click={submitAdvance} disabled={submitting}>
                <Icon icon="bi:send" />
                <BilingualText key="new_expense_advance" stacked={false} />
              </button>
            </div>
          </div>
        </div>

        <!-- Advances List -->
        <h6 class="fw-bold text-secondary mb-3">Danh sách Đơn Tạm ứng</h6>
        {#if loading}
          <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
        {:else if advances.length === 0}
          <div class="text-center text-muted py-4">Chưa có khoản tạm ứng nào.</div>
        {:else}
          <div class="table-responsive">
            <table class="table table-hover table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th>Mã số</th>
                  <th>Người yêu cầu</th>
                  <th>Mục đích & Dự án</th>
                  <th>Số tiền</th>
                  <th>Ngày yêu cầu</th>
                  <th>Trạng thái</th>
                  <th class="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {#each advances as adv (adv.id)}
                  <tr>
                    <td class="font-monospace fw-bold text-primary">{adv.code}</td>
                    <td class="fw-semibold">{adv.user?.legalName || adv.user?.name}</td>
                    <td>
                      <div class="fw-semibold">{adv.title}</div>
                      {#if adv.project}
                        <span class="badge bg-light text-dark border small">{adv.project.name}</span>
                      {/if}
                    </td>
                    <td class="fw-bold text-success fs-6">{formatCurrency(adv.amount)} đ</td>
                    <td class="font-monospace small">{adv.requestDate}</td>
                    <td>
                      <span class="badge {adv.status === 'disbursed' ? 'bg-primary' : (adv.status === 'settled' ? 'bg-success' : (adv.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'))}">
                        {adv.status}
                      </span>
                    </td>
                    <td class="text-end">
                      {#if adv.status === 'pending'}
                        <button class="btn btn-sm btn-success py-0 px-2 me-1" on:click={() => reviewAdvance(adv, 'approved')}>
                          <BilingualText key="approve" stacked={false} />
                        </button>
                        <button class="btn btn-sm btn-primary py-0 px-2 me-1" on:click={() => reviewAdvance(adv, 'disbursed')}>
                          <BilingualText key="disburse" stacked={false} />
                        </button>
                        <button class="btn btn-sm btn-danger py-0 px-2" on:click={() => reviewAdvance(adv, 'rejected')}>
                          <BilingualText key="reject" stacked={false} />
                        </button>
                      {:else if adv.status === 'approved'}
                        <button class="btn btn-sm btn-primary py-0 px-2" on:click={() => reviewAdvance(adv, 'disbursed')}>
                          <BilingualText key="disburse" stacked={false} />
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" on:click={close}>
          <BilingualText key="close" stacked={false} />
        </button>
      </div>
    </div>
  </div>
</div>
{/if}
