<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';

  const dispatch = createEventDispatcher();

  let definitions = [];
  let loading = false;
  let errorMsg = '';

  onMount(() => {
    loadDefinitions();
  });

  export async function loadDefinitions() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get('/api/registry/definitions');
      definitions = res.data.definitions || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function openRegistry(def) {
    dispatch('selectRegistry', { definition: def });
  }

  function editDefinition(def) {
    dispatch('editDesigner', { definition: def });
  }

  function createNewDefinition() {
    dispatch('editDesigner', { definition: null });
  }

  async function deleteDefinition(def) {
    if (!confirm(`Bạn có chắc muốn xóa/lưu trữ sổ bộ "${def.name}" không?`)) return;
    try {
      await axios.delete(`/api/registry/definitions/${def.id}`);
      loadDefinitions();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }
</script>

<div class="container-fluid py-3">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h4 class="fw-bold mb-1 d-flex align-items-center gap-2">
        <Icon icon="bi:journals" class="text-primary" />
        <span>Hệ thống Quản lý Sổ bộ (台帳管理システム)</span>
      </h4>
      <div class="text-muted small">
        Tự định nghĩa các loại sổ sách chuyên biệt, quản lý trường dữ liệu động và theo dõi lịch sử tương tác khách hàng theo thời gian thực.
      </div>
    </div>
    <button class="btn btn-primary d-flex align-items-center gap-1 shadow-sm" on:click={createNewDefinition}>
      <Icon icon="bi:plus-circle" />
      <span>Tạo Mẫu Sổ Mới (No-code Designer)</span>
    </button>
  </div>

  {#if errorMsg}
    <div class="alert alert-danger">{errorMsg}</div>
  {/if}

  {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2 text-muted">Đang tải danh sách sổ bộ...</div>
    </div>
  {:else if definitions.length === 0}
    <div class="card shadow-sm border-0 text-center py-5">
      <div class="card-body">
        <Icon icon="bi:journal-plus" style="font-size: 3.5rem;" class="text-primary mb-3" />
        <h5 class="fw-bold">Chưa có Mẫu Sổ bộ nào</h5>
        <p class="text-muted mb-4">Bạn có thể tạo sổ quản lý khách hàng VIP, sổ hồ sơ hợp đồng, sổ bảo hành, hoặc bất kỳ loại sổ sách nào theo yêu cầu.</p>
        <button class="btn btn-primary" on:click={createNewDefinition}>
          <Icon icon="bi:plus-lg" class="me-1" /> Thiết kế Mẫu Sổ Đầu Tiên
        </button>
      </div>
    </div>
  {:else}
    <div class="row g-3">
      {#each definitions as def (def.id)}
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm border-0 hover-shadow transition-all">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="p-2 rounded bg-light text-primary border">
                    <Icon icon={def.icon || 'bi-journal-bookmark'} style="font-size: 1.5rem;" />
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0 text-dark">{def.name}</h6>
                    <span class="badge bg-light text-secondary border font-monospace small">{def.code}</span>
                  </div>
                </div>
                <div class="dropdown">
                  <button class="btn btn-sm btn-link text-muted p-0" type="button" data-bs-toggle="dropdown">
                    <Icon icon="bi:three-dots-vertical" />
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><button class="dropdown-item small" on:click={() => editDefinition(def)}><Icon icon="bi:gear" class="me-2" />Cấu hình schema</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item small text-danger" on:click={() => deleteDefinition(def)}><Icon icon="bi:trash" class="me-2" />Xóa sổ bộ</button></li>
                  </ul>
                </div>
              </div>

              <p class="text-muted small mb-3 flex-grow-1">
                {def.description || 'Chưa có mô tả cho mẫu sổ này.'}
              </p>

              <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
                <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2 py-1">
                  {def.entryCount || 0} bản ghi
                </span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" on:click={() => editDefinition(def)} title="Cấu hình">
                    <Icon icon="bi:sliders" />
                  </button>
                  <button class="btn btn-sm btn-primary" on:click={() => openRegistry(def)}>
                    Mở Sổ Bộ <Icon icon="bi:arrow-right" class="ms-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
  .hover-shadow:hover {
    transform: translateY(-3px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
  }
</style>
