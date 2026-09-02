<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let categories = [];
  let advances = [];
  let projects = [];
  let companies = [];
  let loading = false;
  let submitting = false;
  let errorMsg = '';

  let title = '';
  let claimDate = new Date().toISOString().split('T')[0];
  let projectId = '';
  let selectedAdvanceId = '';
  let note = '';

  let items = [
    {
      expenseCategoryId: '',
      companyId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 1000000,
      taxAmount: 80000,
      description: 'Chi phí công tác'
    }
  ];

  $: selectedAdvance = advances.find(a => String(a.id) === String(selectedAdvanceId));
  $: advanceAmount = selectedAdvance ? parseFloat(selectedAdvance.amount || 0) : 0;
  $: totalExpense = items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);
  $: netReimbursement = Math.max(0, totalExpense - advanceAmount);

  $: if (isOpen) {
    initData();
  }

  async function initData() {
    loading = true;
    errorMsg = '';
    try {
      const [catRes, advRes, prjRes, comRes] = await Promise.all([
        axios.get('/api/expense/categories'),
        axios.get('/api/expense/advances?status=disbursed'),
        axios.get('/api/projects'),
        axios.get('/api/company')
      ]);
      categories = catRes.data.categories || [];
      advances = advRes.data.advances || [];
      projects = prjRes.data.projects || [];
      companies = comRes.data.companies || [];

      if (categories.length > 0 && !items[0].expenseCategoryId) {
        items[0].expenseCategoryId = categories[0].id;
      }
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function addItem() {
    items = [
      ...items,
      {
        expenseCategoryId: categories.length > 0 ? categories[0].id : '',
        companyId: '',
        date: claimDate,
        amount: 500000,
        taxAmount: 40000,
        description: 'Chi phí phát sinh'
      }
    ];
  }

  function removeItem(idx) {
    if (items.length <= 1) return;
    items = items.filter((_, i) => i !== idx);
  }

  async function submitClaim() {
    if (!title || items.length === 0) {
      errorMsg = 'Vui lòng nhập tiêu đề hồ sơ và ít nhất 1 dòng chi phí.';
      return;
    }

    submitting = true;
    errorMsg = '';
    try {
      await axios.post('/api/expense/claims', {
        title,
        claimDate,
        projectId: projectId ? parseInt(projectId, 10) : null,
        expenseAdvanceId: selectedAdvanceId ? parseInt(selectedAdvanceId, 10) : null,
        note,
        items
      });
      dispatch('created');
      close();
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      submitting = false;
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
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title d-flex align-items-center gap-2">
          <Icon icon="bi:file-earmark-spreadsheet" />
          <BilingualText key="new_expense_claim" stacked={false} />
        </h5>
        <button type="button" class="btn-close btn-close-white" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <!-- Header Info -->
        <div class="card p-3 bg-light border mb-4">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-bold"><BilingualText key="claim_title" stacked={false} /> <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="VD: Quyết toán công tác Đà Nẵng Q3/2026" bind:value={title}>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-bold"><BilingualText key="claim_date" stacked={false} /></label>
              <input type="date" class="form-control" bind:value={claimDate}>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-bold">Dự án liên quan</label>
              <select class="form-select" bind:value={projectId}>
                <option value="">-- Không phân bổ dự án --</option>
                {#each projects as p}
                  <option value={p.id}>{p.name}</option>
                {/each}
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Trừ khoản Tạm ứng đã nhận (仮払金相殺)</label>
              <select class="form-select" bind:value={selectedAdvanceId}>
                <option value="">-- Không có khoản tạm ứng nào --</option>
                {#each advances as a}
                  <option value={a.id}>{a.code} - {a.title} ({formatCurrency(a.amount)} đ)</option>
                {/each}
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Ghi chú chung</label>
              <input type="text" class="form-control" placeholder="Ghi chú thêm cho bộ phận kế toán duyệt..." bind:value={note}>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold text-primary mb-0 d-flex align-items-center gap-1">
            <Icon icon="bi:list-check" /> Chi tiết các dòng chi phí (Expense Lines)
          </h6>
          <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" on:click={addItem}>
            <Icon icon="bi:plus-circle" /> <BilingualText key="add_expense_item" stacked={false} />
          </button>
        </div>

        <div class="table-responsive border rounded mb-4">
          <table class="table table-sm table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 140px;"><BilingualText key="item_date" stacked={false} /></th>
                <th style="width: 200px;"><BilingualText key="item_category" stacked={false} /></th>
                <th><BilingualText key="item_description" stacked={false} /></th>
                <th style="width: 180px;"><BilingualText key="item_merchant" stacked={false} /></th>
                <th style="width: 150px;" class="text-end"><BilingualText key="item_amount" stacked={false} /></th>
                <th style="width: 40px;"></th>
              </tr>
            </thead>
            <tbody>
              {#each items as item, idx (idx)}
                <tr>
                  <td>
                    <input type="date" class="form-control form-control-sm" bind:value={item.date}>
                  </td>
                  <td>
                    <select class="form-select form-select-sm" bind:value={item.expenseCategoryId}>
                      {#each categories as c}
                        <option value={c.id}>{c.name} ({c.accountCode})</option>
                      {/each}
                    </select>
                  </td>
                  <td>
                    <input type="text" class="form-control form-control-sm" placeholder="Nội dung chi..." bind:value={item.description}>
                  </td>
                  <td>
                    <select class="form-select form-select-sm" bind:value={item.companyId}>
                      <option value="">-- Tùy chọn --</option>
                      {#each companies as comp}
                        <option value={comp.id}>{comp.name}</option>
                      {/each}
                    </select>
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm text-end fw-bold" bind:value={item.amount}>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger py-0 px-1" on:click={() => removeItem(idx)} disabled={items.length <= 1}>
                      <Icon icon="bi:trash" />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Settlement Summary Card -->
        <div class="card p-3 bg-light border">
          <div class="row g-2 text-center">
            <div class="col-md-4">
              <div class="p-2 bg-white rounded border">
                <span class="small text-muted d-block"><BilingualText key="total_expense" stacked={false} /></span>
                <span class="fw-bold fs-5 text-primary">{formatCurrency(totalExpense)} đ</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-2 bg-white rounded border">
                <span class="small text-muted d-block"><BilingualText key="advance_offset" stacked={false} /></span>
                <span class="fw-bold fs-5 text-danger">-{formatCurrency(advanceAmount)} đ</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-2 bg-white rounded border">
                <span class="small text-muted d-block"><BilingualText key="net_reimbursement" stacked={false} /></span>
                <span class="fw-bold fs-5 text-success">{formatCurrency(netReimbursement)} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" on:click={close}>
          <BilingualText key="close" stacked={false} />
        </button>
        <button type="button" class="btn btn-primary d-flex align-items-center gap-1" on:click={submitClaim} disabled={submitting}>
          {#if submitting}
            <span class="spinner-border spinner-border-sm"></span>
          {:else}
            <Icon icon="bi:send" />
          {/if}
          Nộp Hồ sơ Quyết toán
        </button>
      </div>
    </div>
  </div>
</div>
{/if}
