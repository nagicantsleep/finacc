<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let categories = [];
  let loading = false;
  let saving = false;
  let errorMsg = '';

  let name = '';
  let code = '';
  let accountCode = '642';
  let icon = 'bi-receipt';
  let description = '';
  let requiresReceipt = true;

  $: if (isOpen) {
    loadCategories();
  }

  async function loadCategories() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get('/api/expense/categories');
      categories = res.data.categories || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function saveCategory() {
    if (!name || !code) {
      errorMsg = 'Vui lòng nhập tên và mã hạng mục.';
      return;
    }

    saving = true;
    errorMsg = '';
    try {
      await axios.post('/api/expense/categories', {
        name,
        code,
        accountCode,
        icon,
        description,
        requiresReceipt
      });
      name = '';
      code = '';
      description = '';
      loadCategories();
      dispatch('updated');
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
          <Icon icon="bi:tag" class="text-primary" />
          <BilingualText key="expense_categories" stacked={false} />
        </h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <!-- Add Category Form -->
        <div class="card p-3 bg-light border mb-4">
          <h6 class="fw-bold text-primary mb-3">Thêm Hạng mục Chi phí mới</h6>
          <div class="row g-2">
            <div class="col-md-5">
              <label class="form-label small fw-bold">Tên hạng mục <span class="text-danger">*</span></label>
              <input type="text" class="form-control form-control-sm" placeholder="VD: Công tác & Đi lại" bind:value={name}>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Mã Code <span class="text-danger">*</span></label>
              <input type="text" class="form-control form-control-sm" placeholder="VD: travel" bind:value={code}>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold">TK Kế toán Nợ</label>
              <select class="form-select form-select-sm" bind:value={accountCode}>
                <option value="642">642 - Chi phí QLDN</option>
                <option value="641">641 - Chi phí Bán hàng</option>
                <option value="627">627 - Chi phí Sản xuất chung</option>
                <option value="154">154 - Chi phí SXKD dở dang</option>
              </select>
            </div>
            <div class="col-12 mt-2">
              <input type="text" class="form-control form-control-sm" placeholder="Mô tả / Hướng dẫn áp dụng..." bind:value={description}>
            </div>
            <div class="col-12 d-flex justify-content-between align-items-center mt-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="reqRecCheck" bind:checked={requiresReceipt}>
                <label class="form-check-label small" for="reqRecCheck">Bắt buộc đính kèm hóa đơn / chứng từ</label>
              </div>
              <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" on:click={saveCategory} disabled={saving}>
                <Icon icon="bi:plus-lg" /> Lưu Hạng mục
              </button>
            </div>
          </div>
        </div>

        <!-- Categories List -->
        <h6 class="fw-bold text-secondary mb-3">Danh mục hiện có</h6>
        {#if loading}
          <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
        {:else if categories.length === 0}
          <div class="text-center text-muted py-4">Chưa có hạng mục chi phí nào.</div>
        {:else}
          <div class="table-responsive">
            <table class="table table-hover table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th>Tên hạng mục</th>
                  <th>Mã code</th>
                  <th>TK Nợ</th>
                  <th>Hóa đơn</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {#each categories as c (c.id)}
                  <tr>
                    <td class="fw-bold text-primary">{c.name}</td>
                    <td class="font-monospace"><span class="badge bg-light text-dark border">{c.code}</span></td>
                    <td class="fw-semibold">{c.accountCode}</td>
                    <td>
                      {#if c.requiresReceipt}
                        <span class="badge bg-success">Bắt buộc</span>
                      {:else}
                        <span class="badge bg-secondary">Tùy chọn</span>
                      {/if}
                    </td>
                    <td class="small text-muted">{c.description || '-'}</td>
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
