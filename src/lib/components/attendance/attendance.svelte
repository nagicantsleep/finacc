<script>
  import Icon from '@iconify/svelte';
  import ClockPanel from './clock-panel.svelte';
  import MonthlyTimesheet from './monthly-timesheet.svelte';
  import LeaveRequestModal from './leave-request-modal.svelte';
  import BilingualText from '$lib/components/BilingualText.svelte';

  let timesheetComponent;
  let isLeaveModalOpen = false;

  function handleAttendanceUpdated() {
    if (timesheetComponent) {
      timesheetComponent.loadMonthly();
    }
  }
</script>

<div class="container-fluid py-3">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h4 class="fw-bold mb-1 d-flex align-items-center gap-2">
        <Icon icon="bi:alarm" class="text-primary" />
        <BilingualText key="attendance_management" />
      </h4>
      <div class="text-muted small">
        <BilingualText key="attendance_desc" />
      </div>
    </div>
    <button class="btn btn-outline-primary d-flex align-items-center gap-1 shadow-sm" on:click={() => isLeaveModalOpen = true}>
      <Icon icon="bi:calendar-check" />
      <BilingualText key="leave_requests" stacked={false} />
    </button>
  </div>

  <!-- Realtime Clock In / Out Visual Card -->
  <ClockPanel on:updated={handleAttendanceUpdated} />

  <!-- Monthly Sheet -->
  <MonthlyTimesheet bind:this={timesheetComponent} />

  <!-- Leave Request Modal -->
  <LeaveRequestModal bind:isOpen={isLeaveModalOpen} on:updated={handleAttendanceUpdated} />
</div>
