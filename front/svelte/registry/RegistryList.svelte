<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '../components/bilingual-text.svelte';

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
    if (!confirm('この台帳を削除しますか？ / Bạn có chắc muốn xóa sổ bộ này?')) return;
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
        <BilingualText key="registry_management" />
      </h4>
      <div class="text-muted small">
        <BilingualText key="registry_desc" />
      </div>
    </div>
    <button class="btn btn-primary d-flex align-items-center gap-1 shadow-sm" on:click={createNewDefinition}>
      <Icon icon="bi:plus-circle" />
      <BilingualText key="registry_create_new_template" stacked={false} />
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
        <h5 class="fw-bold"><BilingualText key="registry_no_templates" /></h5>
        <p class="text-muted mb-4"><BilingualText key="registry_no_templates_desc" /></p>
        <button class="btn btn-primary" on:click={createNewDefinition}>
          <Icon icon="bi:plus-lg" class="me-1" />
          <BilingualText key="registry_create_first" stacked={false} />
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
                    <li><button class="dropdown-item small" on:click={() => editDefinition(def)}><Icon icon="bi:gear" class="me-2" /><BilingualText key="registry_configure_schema" stacked={false} /></button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item small text-danger" on:click={() => deleteDefinition(def)}><Icon icon="bi:trash" class="me-2" /><BilingualText key="delete" stacked={false} /></button></li>
                  </ul>
                </div>
              </div>

              <p class="text-muted small mb-3 flex-grow-1">
                {def.description || ''}
              </p>

              <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
                <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2 py-1">
                  {def.entryCount || 0} records
                </span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" on:click={() => editDefinition(def)} title="Cấu hình">
                    <Icon icon="bi:sliders" />
                  </button>
                  <button class="btn btn-sm btn-primary d-flex align-items-center gap-1" on:click={() => openRegistry(def)}>
                    <BilingualText key="registry_open_ledger" stacked={false} />
                    <Icon icon="bi:arrow-right" />
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
