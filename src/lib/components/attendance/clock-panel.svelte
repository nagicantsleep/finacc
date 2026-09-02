<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  const dispatch = createEventDispatcher();

  export let initialData = null;

  let todayRecord = initialData?.todayRecord || null;
  let loading = false;
  let clocking = false;
  let errorMsg = '';
  let note = '';
  let currentTime = new Date().toLocaleTimeString();

  onMount(() => {
    if (!todayRecord) {
      loadToday();
    }
    const interval = setInterval(() => {
      currentTime = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(interval);
  });

  async function loadToday() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get('/api/attendance/today');
      todayRecord = res.data.record;
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function handleClockIn() {
    clocking = true;
    errorMsg = '';
    try {
      const res = await axios.post('/api/attendance/clock-in', { note });
      todayRecord = res.data.record;
      note = '';
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      clocking = false;
    }
  }

  async function handleClockOut() {
    clocking = true;
    errorMsg = '';
    try {
      const res = await axios.post('/api/attendance/clock-out', { note });
      todayRecord = res.data.record;
      note = '';
      dispatch('updated');
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      clocking = false;
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="card shadow-sm border-0 bg-gradient text-dark p-4">
  <div class="row align-items-center">
    <div class="col-md-5 border-end text-center text-md-start">
      <div class="small text-muted text-uppercase fw-bold mb-1">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div class="display-5 fw-bold text-primary font-monospace">{currentTime}</div>
      <div class="mt-2">
        <span class="badge {todayRecord?.clockIn ? (todayRecord?.clockOut ? 'bg-success' : 'bg-primary') : 'bg-secondary'} px-3 py-2">
          {todayRecord?.clockIn ? (todayRecord?.clockOut ? 'Đã hoàn thành ca làm việc' : 'Đang trong ca làm việc') : 'Chưa vào ca'}
        </span>
      </div>
    </div>

    <div class="col-md-7 ps-md-4 mt-3 mt-md-0">
      {#if errorMsg}
        <div class="alert alert-danger py-2 small mb-3">{errorMsg}</div>
      {/if}

      <div class="d-flex flex-wrap gap-3 align-items-center mb-3">
        <div class="flex-grow-1">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder="Ghi chú ca làm (VD: làm việc từ xa, dự án Alpha...)"
            bind:value={note}
          />
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-primary d-flex align-items-center gap-1 px-3 shadow-sm"
            on:click={handleClockIn}
            disabled={clocking || (todayRecord && todayRecord.clockIn)}
          >
            <Icon icon="bi:box-arrow-in-right" />
            <BilingualText key="clock_in" stacked={false} />
          </button>

          <button
            class="btn btn-success d-flex align-items-center gap-1 px-3 shadow-sm"
            on:click={handleClockOut}
            disabled={clocking || !todayRecord?.clockIn || !!todayRecord?.clockOut}
          >
            <Icon icon="bi:box-arrow-right" />
            <BilingualText key="clock_out" stacked={false} />
          </button>
        </div>
      </div>

      <div class="row g-2 text-center">
        <div class="col-4">
          <div class="p-2 bg-light rounded border">
            <div class="small text-muted"><BilingualText key="clock_in" stacked={false} /></div>
            <div class="fw-bold fs-6 text-primary">{formatTime(todayRecord?.clockIn)}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 bg-light rounded border">
            <div class="small text-muted"><BilingualText key="clock_out" stacked={false} /></div>
            <div class="fw-bold fs-6 text-success">{formatTime(todayRecord?.clockOut)}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 bg-light rounded border">
            <div class="small text-muted"><BilingualText key="work_hours" stacked={false} /></div>
            <div class="fw-bold fs-6 text-dark">{todayRecord?.workHours || 0} h</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
