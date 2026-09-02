<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let members = [];
  let memberClasses = [];
  let formulas = [];
  let loading = false;
  let saving = false;
  let errorMsg = '';

  let selectedMemberId = '';
  let baseSalary = 3000000;
  let hourlyRate = 18750;
  let overtimeMultiplier = 1.25;

  let allowances = [
    { key: 'commute', name: 'Phụ cấp đi lại', amount: 300000 },
    { key: 'lunch', name: 'Phụ cấp ăn trưa', amount: 500000 }
  ];

  let deductions = [
    { key: 'health_ins', name: 'Bảo hiểm y tế (BHYT)', rate: 0.015 },
    { key: 'social_ins', name: 'Bảo hiểm xã hội (BHXH)', rate: 0.08 }
  ];

  $: if (isOpen) {
    initData();
  }

  async function initData() {
    loading = true;
    errorMsg = '';
    try {
      const [memRes, clsRes, forRes] = await Promise.all([
        axios.get('/api/users/member'),
        axios.get('/api/member_classes'),
        axios.get('/api/payroll/formulas')
      ]);
      members = memRes.data?.users || [];
      memberClasses = clsRes.data?.memberClasses || [];
      formulas = forRes.data?.formulas || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function addAllowance() {
    allowances = [...allowances, { key: `allowance_${Date.now().toString(36).slice(-3)}`, name: 'Phụ cấp mới', amount: 200000 }];
  }

  function removeAllowance(idx) {
    allowances = allowances.filter((_, i) => i !== idx);
  }

  function addDeduction() {
    deductions = [...deductions, { key: `deduction_${Date.now().toString(36).slice(-3)}`, name: 'Khoản khấu trừ', amount: 100000 }];
  }

  function removeDeduction(idx) {
    deductions = deductions.filter((_, i) => i !== idx);
  }

  async function saveFormula() {
    if (!selectedMemberId) {
      errorMsg = 'Vui lòng chọn nhân viên hoặc nhóm đối tượng.';
      return;
    }

    saving = true;
    errorMsg = '';
    try {
      await axios.post('/api/payroll/formulas', {
        tenantMemberId: parseInt(selectedMemberId, 10),
        baseSalary: parseFloat(baseSalary),
        hourlyRate: parseFloat(hourlyRate),
        overtimeMultiplier: parseFloat(overtimeMultiplier),
        allowances,
        deductions
      });
      dispatch('saved');
      close();
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      saving = false;
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
          <Icon icon="bi:cash-coin" class="text-primary" />
          <BilingualText key="salary_formula_setup" stacked={false} />
        </h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">Chọn Nhân sự / Nhân viên <span class="text-danger">*</span></label>
            <select class="form-select" bind:value={selectedMemberId}>
              <option value="">-- Chọn nhân sự --</option>
              {#each members as m}
                <option value={m.id}>{m.legalName || m.name} ({m.email})</option>
              {/each}
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold"><BilingualText key="base_salary" stacked={false} /></label>
            <input type="number" class="form-control" bind:value={baseSalary}>
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold">Hệ số tăng ca (OT)</label>
            <input type="number" step="0.05" class="form-control" bind:value={overtimeMultiplier}>
          </div>
        </div>

        <hr>

        <!-- Allowances List -->
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold text-success mb-0"><BilingualText key="allowances" stacked={false} /></h6>
          <button class="btn btn-sm btn-outline-success" on:click={addAllowance}>
            <Icon icon="bi:plus-circle" class="me-1" /> Thêm phụ cấp
          </button>
        </div>
        <div class="mb-4">
          {#each allowances as al, i (i)}
            <div class="input-group input-group-sm mb-2">
              <input type="text" class="form-control" placeholder="Tên phụ cấp..." bind:value={al.name}>
              <span class="input-group-text">Số tiền</span>
              <input type="number" class="form-control" placeholder="0" bind:value={al.amount}>
              <button class="btn btn-outline-danger" on:click={() => removeAllowance(i)}>
                <Icon icon="bi:trash" />
              </button>
            </div>
          {/each}
        </div>

        <hr>

        <!-- Deductions List -->
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold text-danger mb-0"><BilingualText key="deductions" stacked={false} /></h6>
          <button class="btn btn-sm btn-outline-danger" on:click={addDeduction}>
            <Icon icon="bi:plus-circle" class="me-1" /> Thêm khoản khấu trừ
          </button>
        </div>
        <div class="mb-3">
          {#each deductions as de, i (i)}
            <div class="input-group input-group-sm mb-2">
              <input type="text" class="form-control" placeholder="Tên khoản khấu trừ..." bind:value={de.name}>
              <span class="input-group-text">Tỷ lệ (VD: 0.08 = 8%)</span>
              <input type="number" step="0.005" class="form-control" placeholder="0.08" bind:value={de.rate}>
              <button class="btn btn-outline-danger" on:click={() => removeDeduction(i)}>
                <Icon icon="bi:trash" />
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" on:click={close}>
          <BilingualText key="close" stacked={false} />
        </button>
        <button type="button" class="btn btn-primary" on:click={saveFormula} disabled={saving || loading}>
          {#if saving}
            <span class="spinner-border spinner-border-sm me-1"></span>
          {:else}
            <Icon icon="bi:check-lg" class="me-1" />
          {/if}
          <BilingualText key="save" stacked={false} />
        </button>
      </div>
    </div>
  </div>
</div>
{/if}
