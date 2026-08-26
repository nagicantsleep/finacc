<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';

  export let definition = null;
  export let entryId = null;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let title = '';
  let status = 'open';
  let companyId = '';
  let assignedUserId = '';
  let data = {};
  let companies = [];
  let users = [];

  let timelines = [];
  let newComment = '';
  let actionType = 'comment';
  let saving = false;
  let loading = false;
  let errorMsg = '';

  const STATUS_OPTIONS = [
    { value: 'open', label: 'Đang mở (Open)', badge: 'bg-primary' },
    { value: 'in_progress', label: 'Đang xử lý (In Progress)', badge: 'bg-info text-dark' },
    { value: 'pending_review', label: 'Chờ duyệt (Pending Review)', badge: 'bg-warning text-dark' },
    { value: 'closed_won', label: 'Thành công (Won)', badge: 'bg-success' },
    { value: 'closed_lost', label: 'Đóng/Hủy (Closed)', badge: 'bg-secondary' }
  ];

  $: if (isOpen) {
    initData();
  }

  async function initData() {
    loading = true;
    errorMsg = '';
    newComment = '';
    try {
      // Load companies and members for select references
      const [compRes, usrRes] = await Promise.all([
        axios.get('/api/company'),
        axios.get('/api/users/member')
      ]);
      companies = compRes.data?.companies || [];
      users = usrRes.data?.users || [];

      if (entryId) {
        const res = await axios.get(`/api/registry/entry/${entryId}`);
        const entry = res.data.entry;
        title = entry.title || '';
        status = entry.status || 'open';
        companyId = entry.companyId ? String(entry.companyId) : '';
        assignedUserId = entry.userId ? String(entry.userId) : '';
        data = entry.data ? { ...entry.data } : {};
        timelines = entry.timelines || [];
      } else {
        title = '';
        status = 'open';
        companyId = '';
        assignedUserId = '';
        data = {};
        timelines = [];
      }
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  async function saveEntry() {
    if (!title.trim()) {
      errorMsg = 'Vui lòng nhập tiêu đề bản ghi.';
      return;
    }

    saving = true;
    errorMsg = '';
    try {
      const payload = {
        title: title.trim(),
        status,
        companyId: companyId ? parseInt(companyId, 10) : null,
        assignedUserId: assignedUserId ? parseInt(assignedUserId, 10) : null,
        data
      };

      if (entryId) {
        await axios.put(`/api/registry/entry/${entryId}`, payload);
      } else {
        await axios.post(`/api/registry/entries/${definition.id}`, payload);
      }

      dispatch('saved');
      close();
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      saving = false;
    }
  }

  async function addTimelineNote() {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/registry/entry/${entryId}/timeline`, {
        action: actionType,
        comment: newComment.trim()
      });
      timelines = [res.data.timeline, ...timelines];
      newComment = '';
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    }
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
</script>

{#if isOpen}
<div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1050;">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content shadow-lg">
      <div class="modal-header bg-light">
        <h5 class="modal-title d-flex align-items-center gap-2">
          <Icon icon={definition?.icon || 'bi-journal-bookmark'} class="text-primary" />
          <span>{entryId ? `Chi tiết Bản ghi: ${title}` : `Tạo Bản ghi Mới trong [${definition?.name}]`}</span>
        </h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>

      <div class="modal-body p-4">
        {#if errorMsg}
          <div class="alert alert-danger py-2">{errorMsg}</div>
        {/if}

        {#if loading}
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2 text-muted">Đang tải dữ liệu...</div>
          </div>
        {:else}
          <div class="row g-4">
            <!-- Left: Record Form Fields -->
            <div class="col-lg-7 border-end">
              <h6 class="fw-bold text-primary mb-3 d-flex align-items-center gap-1">
                <Icon icon="bi:pencil-square" />
                <span>Thông tin Bản ghi Sổ bộ</span>
              </h6>

              <div class="row g-3 mb-3">
                <div class="col-12">
                  <label class="form-label fw-bold">Tiêu đề / Tên sự vụ <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" bind:value={title} placeholder="Nhập tiêu đề hoặc tên khách hàng/vụ việc...">
                </div>

                <div class="col-md-4">
                  <label class="form-label fw-bold">Trạng thái</label>
                  <select class="form-select" bind:value={status}>
                    {#each STATUS_OPTIONS as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label fw-bold">Khách hàng / Đối tác</label>
                  <select class="form-select" bind:value={companyId}>
                    <option value="">-- Chọn đối tác liên quan --</option>
                    {#each companies as comp}
                      <option value={comp.id}>{comp.name}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label fw-bold">Người phụ trách</label>
                  <select class="form-select" bind:value={assignedUserId}>
                    <option value="">-- Chọn nhân viên --</option>
                    {#each users as u}
                      <option value={u.id}>{u.name || u.legalName}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <div class="p-3 bg-light rounded border mb-3">
                <h6 class="fw-bold mb-3 text-secondary">Các Trường Động (Dynamic Fields)</h6>
                <div class="row g-3">
                  {#if definition && definition.schema && definition.schema.fields}
                    {#each definition.schema.fields as field}
                      <div class="col-md-6">
                        <label class="form-label fw-semibold small mb-1">
                          {field.label || field.key}
                          {#if field.required}<span class="text-danger">*</span>{/if}
                        </label>

                        {#if field.type === 'text'}
                          <input type="text" class="form-control form-control-sm" bind:value={data[field.key]} placeholder={`Nhập ${field.label}...`}>
                        {:else if field.type === 'textarea'}
                          <textarea class="form-control form-control-sm" rows="2" bind:value={data[field.key]} placeholder={`Nhập ${field.label}...`}></textarea>
                        {:else if field.type === 'number'}
                          <input type="number" class="form-control form-control-sm" bind:value={data[field.key]} placeholder="0">
                        {:else if field.type === 'date'}
                          <input type="date" class="form-control form-control-sm" bind:value={data[field.key]}>
                        {:else if field.type === 'select'}
                          <select class="form-select form-select-sm" bind:value={data[field.key]}>
                            <option value="">-- Chọn --</option>
                            {#if field.options}
                              {#each field.options as opt}
                                <option value={opt}>{opt}</option>
                              {/each}
                            {/if}
                          </select>
                        {:else if field.type === 'checkbox'}
                          <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" bind:checked={data[field.key]} id={`chk_${field.key}`}>
                            <label class="form-check-label small" for={`chk_${field.key}`}>Kích hoạt / Xác nhận</label>
                          </div>
                        {:else}
                          <input type="text" class="form-control form-control-sm" bind:value={data[field.key]}>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>

            <!-- Right: CRM Interaction Timeline -->
            <div class="col-lg-5">
              <h6 class="fw-bold text-primary mb-3 d-flex align-items-center gap-1">
                <Icon icon="bi:clock-history" />
                <span>Dòng Thời Gian Tương Tác (CRM Timeline)</span>
              </h6>

              {#if entryId}
                <div class="mb-3 p-3 bg-light rounded border">
                  <label class="form-label small fw-bold mb-1">Thêm ghi chú tương tác / trao đổi:</label>
                  <div class="input-group input-group-sm mb-2">
                    <select class="form-select flex-grow-0" style="width: 140px;" bind:value={actionType}>
                      <option value="comment">Ghi chú</option>
                      <option value="contact_log">Cuộc gọi / Zoom</option>
                      <option value="status_change">Đổi trạng thái</option>
                    </select>
                    <input type="text" class="form-control" bind:value={newComment} placeholder="Nội dung trao đổi..." on:keydown={(e) => e.key === 'Enter' && addTimelineNote()}>
                    <button class="btn btn-primary" type="button" on:click={addTimelineNote}>
                      <Icon icon="bi:send" />
                    </button>
                  </div>
                </div>

                <div class="timeline-container pe-2">
                  {#if timelines.length === 0}
                    <div class="text-muted small text-center py-4">Chưa có lịch sử tương tác nào.</div>
                  {:else}
                    {#each timelines as item}
                      <div class="timeline-item mb-3 p-2 rounded border bg-white shadow-sm">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span class="badge bg-secondary text-capitalize">{item.action}</span>
                          <span class="small text-muted">{formatDate(item.createdAt)}</span>
                        </div>
                        <div class="small fw-semibold text-dark">{item.comment || 'Cập nhật hệ thống.'}</div>
                        {#if item.author}
                          <div class="small text-muted mt-1">Bởi: {item.author.legalName || item.author.name}</div>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {:else}
                <div class="alert alert-info small">
                  Sau khi lưu bản ghi lần đầu, bạn có thể ghi lại toàn bộ lịch sử tương tác, cuộc gọi, ghi chú trao đổi trên dòng thời gian này.
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" on:click={close}>Đóng</button>
        <button type="button" class="btn btn-primary" on:click={saveEntry} disabled={saving || loading}>
          {#if saving}
            <span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...
          {:else}
            <Icon icon="bi:check-lg" class="me-1" /> Lưu Bản Ghi
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .timeline-container {
    max-height: 360px;
    overflow-y: auto;
  }
  .timeline-item {
    border-left: 3px solid #0d6efd !important;
  }
</style>
