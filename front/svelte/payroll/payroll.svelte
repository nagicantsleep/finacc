<script>
  import PayrollPeriodList from './payroll-period-list.svelte';
  import PayrollCalculationView from './payroll-calculation-view.svelte';
  import SalaryFormulaModal from './salary-formula-modal.svelte';
  import PayslipModal from './payslip-modal.svelte';

  let currentView = 'list'; // 'list' | 'calc'
  let selectedPeriod = null;

  let isFormulaModalOpen = false;
  let isPayslipModalOpen = false;
  let activeSlip = null;

  let listComponent;
  let calcComponent;

  function handleSelectPeriod(e) {
    selectedPeriod = e.detail.period;
    currentView = 'calc';
  }

  function handleViewSlip(e) {
    activeSlip = e.detail.slip;
    isPayslipModalOpen = true;
  }

  function handlePeriodUpdated() {
    if (listComponent) listComponent.loadPeriods();
    if (calcComponent) calcComponent.loadSlips();
  }
</script>

<div class="payroll-module">
  {#if currentView === 'list'}
    <PayrollPeriodList
      bind:this={listComponent}
      on:selectPeriod={handleSelectPeriod}
      on:openFormula={() => isFormulaModalOpen = true}
    />
  {:else if currentView === 'calc'}
    <PayrollCalculationView
      bind:this={calcComponent}
      period={selectedPeriod}
      on:back={() => { currentView = 'list'; }}
      on:viewSlip={handleViewSlip}
      on:updated={handlePeriodUpdated}
    />
  {/if}

  <!-- Salary Formula Modal -->
  <SalaryFormulaModal
    bind:isOpen={isFormulaModalOpen}
    on:saved={handlePeriodUpdated}
  />

  <!-- Payslip Modal -->
  <PayslipModal
    slip={activeSlip}
    bind:isOpen={isPayslipModalOpen}
  />
</div>
