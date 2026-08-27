<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let definition = null;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let id = null;
  let name = '';
  let code = '';
  let description = '';
  let icon = 'bi-journal-bookmark';
  let fields = [];
  let errorMsg = '';
  let saving = false;

  const FIELD_TYPES = [
    { type: 'text', label: 'Văn bản (Text)' },
    { type: 'textarea', label: 'Đoạn văn (Textarea)' },
    { type: 'number', label: 'Số (Number)' },
    { type: 'date', label: 'Ngày tháng (Date)' },
    { type: 'select', label: 'Lựa chọn (Dropdown Select)' },
    { type: 'checkbox', label: 'Hộp kiểm (Checkbox / Boolean)' },
    { type: 'companyRef', label: 'Liên kết Đối tác (Company Ref)' },
    { type: 'userRef', label: 'Liên kết Nhân viên (User Ref)' }
  ];

  const ICONS = [
    'bi-journal-bookmark', 'bi-gem', 'bi-person-lines-fill', 'bi-file-earmark-medical',
    'bi-shield-check', 'bi-card-checklist', 'bi-briefcase', 'bi-building'
  ];

  $: if (isOpen) {
    if (definition) {
      id = definition.id;
      name = definition.name || '';
      code = definition.code || '';
      description = definition.description || '';
      icon = definition.icon || 'bi-journal-bookmark';
      fields = definition.schema && Array.isArray(definition.schema.fields)
        ? JSON.parse(JSON.stringify(definition.schema.fields))
        : [];
    } else {
      id = null;
      name = '';
      code = '';
      description = '';
      icon = 'bi-journal-bookmark';
      fields = [
        { key: 'contactPerson', label: 'Người liên hệ', type: 'text', required: true },
        { key: 'statusLevel', label: 'Mức độ', type: 'select', options: ['Cao', 'Trung bình', 'Thấp'], required: false }
      ];
    }
    errorMsg = '';
  }

  function addField() {
    const key = `field_${Date.now().toString(36).slice(-4)}`;
    fields = [...fields, { key, label: `Trường ${fields.length + 1}`, type: 'text', required: false, options: [] }];
  }

  function removeField(index) {
    fields = fields.filter((_, i) => i !== index);
  }

  function handleOptionsChange(index, value) {
    const opts = value.split(',').map(s => s.trim()).filter(Boolean);
    fields[index].options = opts;
  }

  async function save() {
    if (!name.trim() || !code.trim()) {
      errorMsg = 'Tên mẫu sổ và mã định danh không được để trống.';
      return;
    }
    if (fields.length === 0) {
      errorMsg = 'Vui lòng thêm ít nhất một trường dữ liệu.';
      return;
    }

    saving = true;
    errorMsg = '';
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
        icon,
        schema: { fields }
      };

      if (id) {
        await axios.put(`/api/registry/definitions/${id}`, payload);
      } else {
        await axios.post('/api/registry/definitions', payload);
      }

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
          <Icon icon={icon} class="text-primary" />
          <span>{id ? 'Chỉnh sửa Cấu hình Sổ bộ' : 'Thiết kế Mẫu Sổ bộ Mới (No-code)'}</span>
        </h5>
        <button type="button" class="btn-close" aria-label="Close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">Tên Sổ bộ (Tiếng Nhật/Việt) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" bind:value={name} placeholder="VD: Sổ Chăm sóc Khách hàng VIP">
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">Mã Code <span class="text-danger">*</span></label>
            <input type="text" class="form-control" bind:value={code} disabled={!!id} placeholder="VD: vip_crm_log">
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">Icon hiển thị</label>
            <select class="form-select" bind:value={icon}>
              {#each ICONS as ic}
                <option value={ic}>{ic.replace('bi-', '')}</option>
              {/each}
            </select>
          </div>
          <div class="col-12">
            <label class="form-label fw-bold">Mô tả mục đích sử dụng</label>
            <input type="text" class="form-control" bind:value={description} placeholder="Ghi chú mục đích và đối tượng sử dụng...">
          </div>
        </div>

        <hr>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="fw-bold mb-0 text-primary d-flex align-items-center gap-1">
            <Icon icon="bi:ui-checks-grid" />
            <span>Định nghĩa các Trường Dữ liệu Động (Fields Schema)</span>
          </h6>
          <button type="button" class="btn btn-sm btn-outline-primary" on:click={addField}>
            <Icon icon="bi:plus-circle" class="me-1" /> Thêm trường mới
          </button>
        </div>

        <div class="fields-list">
          {#each fields as field, i (i)}
            <div class="card mb-2 p-3 bg-light border">
              <div class="row g-2 align-items-center">
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Mã trường (Key)</label>
                  <input type="text" class="form-control form-control-sm" bind:value={field.key} placeholder="key_name">
                </div>
                <div class="col-md-4">
                  <label class="form-label small text-muted mb-1">Tiêu đề hiển thị (Label)</label>
                  <input type="text" class="form-control form-control-sm" bind:value={field.label} placeholder="Tên trường...">
                </div>
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Kiểu dữ liệu (Type)</label>
                  <select class="form-select form-select-sm" bind:value={field.type}>
                    {#each FIELD_TYPES as ft}
                      <option value={ft.type}>{ft.label}</option>
                    {/each}
                  </select>
                </div>
                <div class="col-md-1 text-center">
                  <label class="form-label small text-muted mb-1 d-block">Bắt buộc</label>
                  <input type="checkbox" class="form-check-input" bind:checked={field.required}>
                </div>
                <div class="col-md-1 text-end">
                  <button type="button" class="btn btn-sm btn-outline-danger mt-3" on:click={() => removeField(i)}>
                    <Icon icon="bi:trash" />
                  </button>
                </div>
              </div>

              {#if field.type === 'select'}
                <div class="mt-2 pt-2 border-top">
                  <label class="form-label small text-muted mb-1">Các tùy chọn (phân tách bởi dấu phẩy):</label>
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    value={field.options ? field.options.join(', ') : ''}
                    on:input={(e) => handleOptionsChange(i, e.target.value)}
                    placeholder="VD: Cao, Trung bình, Thấp"
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" on:click={close}>Đóng</button>
        <button type="button" class="btn btn-primary" on:click={save} disabled={saving}>
          {#if saving}
            <span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...
          {:else}
            <Icon icon="bi:check-lg" class="me-1" /> Lưu Cấu hình
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .fields-list {
    max-height: 380px;
    overflow-y: auto;
  }
</style>
