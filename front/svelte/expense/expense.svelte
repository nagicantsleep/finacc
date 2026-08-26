<script>
  import Icon from '@iconify/svelte';
  import ExpenseClaimList from './ExpenseClaimList.svelte';
  import ExpenseClaimModal from './ExpenseClaimModal.svelte';
  import ExpenseAdvanceModal from './ExpenseAdvanceModal.svelte';
  import ExpenseCategoryModal from './ExpenseCategoryModal.svelte';
  import BilingualText from '../components/bilingual-text.svelte';

  let listComponent;
  let isClaimModalOpen = false;
  let isAdvanceModalOpen = false;
  let isCategoryModalOpen = false;

  function handleUpdated() {
    if (listComponent) {
      listComponent.loadClaims();
    }
  }
</script>

<div class="container-fluid py-3">
  <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
      <h4 class="fw-bold mb-1 d-flex align-items-center gap-2">
        <Icon icon="bi:receipt-cutoff" class="text-primary" />
        <BilingualText key="expense_management" />
      </h4>
      <div class="text-muted small">
        <BilingualText key="expense_desc" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="d-flex gap-2 flex-wrap">
      <button class="btn btn-outline-secondary d-flex align-items-center gap-1 shadow-sm" on:click={() => isCategoryModalOpen = true}>
        <Icon icon="bi:tag" />
        <BilingualText key="expense_categories" stacked={false} />
      </button>

      <button class="btn btn-outline-primary d-flex align-items-center gap-1 shadow-sm" on:click={() => isAdvanceModalOpen = true}>
        <Icon icon="bi:cash-stack" />
        <BilingualText key="expense_advances" stacked={false} />
      </button>

      <button class="btn btn-primary d-flex align-items-center gap-1 shadow-sm" on:click={() => isClaimModalOpen = true}>
        <Icon icon="bi:plus-lg" />
        <BilingualText key="new_expense_claim" stacked={false} />
      </button>
    </div>
  </div>

  <!-- Claims Table List -->
  <ExpenseClaimList bind:this={listComponent} />

  <!-- Modals -->
  <ExpenseClaimModal
    bind:isOpen={isClaimModalOpen}
    on:created={handleUpdated}
  />

  <ExpenseAdvanceModal
    bind:isOpen={isAdvanceModalOpen}
    on:updated={handleUpdated}
  />

  <ExpenseCategoryModal
    bind:isOpen={isCategoryModalOpen}
    on:updated={handleUpdated}
  />
</div>
