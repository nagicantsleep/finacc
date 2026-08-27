<script>
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let records = [];
  let summary = { workingDays: 0, totalWorkHours: 0, totalOvertimeHours: 0, totalLateMinutes: 0 };
  let loading = false;
  let errorMsg = '';

  onMount(() => {
    loadMonthly();
  });

  export async function loadMonthly() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get(`/api/attendance/monthly?year=${year}&month=${month}`);
      records = res.data.records || [];
      summary = res.data.summary || { workingDays: 0, totalWorkHours: 0, totalOvertimeHours: 0, totalLateMinutes: 0 };
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function changeMonth(delta) {
    let newM = month + delta;
    if (newM > 12) {
      year += 1;
      month = 1;
    } else if (newM < 1) {
      year -= 1;
      month = 12;
    } else {
      month = newM;
    }
    loadMonthly();
  }

  function formatTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="card shadow-sm border-0 mt-4">
  <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-outline-secondary btn-sm" on:click={() => changeMonth(-1)}>
        <Icon icon="bi:chevron-left" />
      </button>
      <h5 class="mb-0 fw-bold font-monospace text-primary">
        {year} 年 {month} 月
      </h5>
      <button class="btn btn-outline-secondary btn-sm" on:click={() => changeMonth(1)}>
        <Icon icon="bi:chevron-right" />
      </button>
    </div>

    <!-- Summary Badges -->
    <div class="d-flex gap-2 flex-wrap">
      <span class="badge bg-light text-dark border p-2">
        <span class="text-muted">Ngày công:</span> <strong class="text-primary">{summary.workingDays}</strong> ngày
      </span>
      <span class="badge bg-light text-dark border p-2">
        <span class="text-muted"><BilingualText key="work_hours" stacked={false} />:</span> <strong class="text-success">{summary.totalWorkHours}</strong> h
      </span>
      <span class="badge bg-light text-dark border p-2">
        <span class="text-muted"><BilingualText key="overtime_hours" stacked={false} />:</span> <strong class="text-danger">{summary.totalOvertimeHours}</strong> h
      </span>
    </div>
  </div>

  <div class="card-body p-0">
    {#if errorMsg}
      <div class="alert alert-danger m-3">{errorMsg}</div>
    {/if}

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <div class="mt-2 text-muted">Đang tải bảng chấm công...</div>
      </div>
    {:else if records.length === 0}
      <div class="text-center py-5 text-muted">
        <Icon icon="bi:calendar-x" style="font-size: 2.5rem;" class="mb-2" />
        <div>Chưa có dữ liệu chấm công nào trong tháng này.</div>
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-hover table-striped mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 120px;">Ngày</th>
              <th style="width: 110px;"><BilingualText key="clock_in" stacked={false} /></th>
              <th style="width: 110px;"><BilingualText key="clock_out" stacked={false} /></th>
              <th><BilingualText key="work_hours" stacked={false} /></th>
              <th><BilingualText key="overtime_hours" stacked={false} /></th>
              <th><BilingualText key="late_minutes" stacked={false} /></th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {#each records as r (r.id)}
              <tr>
                <td class="fw-semibold font-monospace">{r.date}</td>
                <td class="text-primary font-monospace">{formatTime(r.clockIn)}</td>
                <td class="text-success font-monospace">{formatTime(r.clockOut)}</td>
                <td class="fw-bold">{r.workHours} h</td>
                <td class="text-danger">{r.overtimeHours > 0 ? `+${r.overtimeHours} h` : '-'}</td>
                <td class="text-warning text-dark">{r.lateMinutes > 0 ? `${r.lateMinutes} min` : '-'}</td>
                <td>
                  <span class="badge {r.status === 'leave' ? 'bg-info text-dark' : (r.status === 'overtime' ? 'bg-danger' : 'bg-secondary')}">
                    {r.status}
                  </span>
                </td>
                <td class="small text-muted">{r.note || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
