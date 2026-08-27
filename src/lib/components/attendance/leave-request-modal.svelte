<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let leaves = [];
  let loading = false;
  let submitting = false;
  let errorMsg = '';

  let leaveType = 'paid_annual';
  let startDate = new Date().toISOString().split('T')[0];
  let endDate = new Date().toISOString().split('T')[0];
  let days = 1.0;
  let reason = '';

  $: if (isOpen) {
    loadLeaves();
  }

  async function loadLeaves() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get('/api/attendance/leaves?allMembers=true');
      leaves = res.data.leaves || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function submitLeave() {
    submitting = true;
    errorMsg = '';
    try {
      await axios.post('/api/attendance/leaves', {
        leaveType,
        startDate,
        endDate,
        days: parseFloat(days),
        reason
      });
      reason = '';
      loadLeaves();
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      submitting = false;
    }
  }

  async function reviewLeave(leave, status) {
    try {
      await axios.put(`/api/attendance/leaves/${leave.id}/review`, { status });
      loadLeaves();
      dispatch('updated');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }
</script>

{#if isOpen}
<div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1050;">
  <div class="modal-dialog modal-lg modal-dialog-scrollable">
    <div class="modal-content shadow-lg">
      <div class="modal-header bg-light">
        <h5 class="modal-title d-flex align-items-center gap-2">
          <Icon icon="bi:calendar-check" class="text-primary" />
          <BilingualText key="leave_requests" stacked={false} />
        </h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <!-- Submit new request form -->
        <div class="card p-3 bg-light border mb-4">
          <h6 class="fw-bold text-primary mb-3"><BilingualText key="submit_leave" stacked={false} /></h6>
          <div class="row g-2">
            <div class="col-md-4">
              <label class="form-label small fw-bold"><BilingualText key="leave_type" stacked={false} /></label>
              <select class="form-select form-select-sm" bind:value={leaveType}>
                <option value="paid_annual">有給休暇 / Nghỉ phép năm</option>
                <option value="unpaid">無給休暇 / Nghỉ không lương</option>
                <option value="sick">病気休暇 / Nghỉ ốm</option>
                <option value="maternity">産休・育休 / Thai sản</option>
                <option value="special">特別休暇 / Việc riêng</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Từ ngày</label>
              <input type="date" class="form-control form-control-sm" bind:value={startDate}>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Đến ngày</label>
              <input type="date" class="form-control form-control-sm" bind:value={endDate}>
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-bold"><BilingualText key="days_count" stacked={false} /></label>
              <input type="number" step="0.5" class="form-control form-control-sm" bind:value={days}>
            </div>
            <div class="col-12 mt-2">
              <input type="text" class="form-control form-control-sm" placeholder="Lý do xin nghỉ phép..." bind:value={reason}>
            </div>
            <div class="col-12 text-end mt-2">
              <button class="btn btn-primary btn-sm d-flex align-items-center gap-1 ms-auto" on:click={submitLeave} disabled={submitting}>
                <Icon icon="bi:send" />
                <BilingualText key="submit_leave" stacked={false} />
              </button>
            </div>
          </div>
        </div>

        <!-- Leaves List -->
        <h6 class="fw-bold text-secondary mb-3">Danh sách Đơn xin nghỉ gần đây</h6>
        {#if loading}
          <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
        {:else if leaves.length === 0}
          <div class="text-center text-muted py-4">Chưa có đơn xin nghỉ nào.</div>
        {:else}
          <div class="table-responsive">
            <table class="table table-hover table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th>Nhân sự</th>
                  <th>Loại nghỉ</th>
                  <th>Thời gian</th>
                  <th>Số ngày</th>
                  <th>Trạng thái</th>
                  <th class="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {#each leaves as item (item.id)}
                  <tr>
                    <td class="fw-semibold">{item.user?.legalName || item.user?.name || '-'}</td>
                    <td><span class="badge bg-light text-dark border">{item.leaveType}</span></td>
                    <td class="small font-monospace">{item.startDate} ~ {item.endDate}</td>
                    <td class="fw-bold">{item.days} ngày</td>
                    <td>
                      <span class="badge {item.status === 'approved' ? 'bg-success' : (item.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark')}">
                        {item.status}
                      </span>
                    </td>
                    <td class="text-end">
                      {#if item.status === 'pending'}
                        <button class="btn btn-sm btn-success py-0 px-2 me-1" on:click={() => reviewLeave(item, 'approved')}>
                          <BilingualText key="approve" stacked={false} />
                        </button>
                        <button class="btn btn-sm btn-danger py-0 px-2" on:click={() => reviewLeave(item, 'rejected')}>
                          <BilingualText key="reject" stacked={false} />
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
