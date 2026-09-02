<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  export let definition = null;

  const dispatch = createEventDispatcher();

  let entries = [];
  let total = 0;
  let loading = false;
  let errorMsg = '';

  let searchQuery = '';
  let statusFilter = 'all';
  let limit = 50;
  let offset = 0;

  const STATUS_BADGES = {
    open: { label: 'Open', class: 'bg-primary' },
    in_progress: { label: 'In Progress', class: 'bg-info text-dark' },
    pending_review: { label: 'Review', class: 'bg-warning text-dark' },
    closed_won: { label: 'Won', class: 'bg-success' },
    closed_lost: { label: 'Closed', class: 'bg-secondary' }
  };

  $: if (definition) {
    loadEntries();
  }

  export async function loadEntries() {
    if (!definition) return;
    loading = true;
    errorMsg = '';
    try {
      const params = {
        q: searchQuery,
        status: statusFilter,
        limit,
        offset
      };
      const res = await axios.get(`/api/registry/entries/${definition.id}`, { params });
      entries = res.data.entries || [];
      total = res.data.total || 0;
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function handleSearch() {
    offset = 0;
    loadEntries();
  }

  function openNewEntry() {
    dispatch('openEntry', { entryId: null });
  }

  function openEditEntry(entry) {
    dispatch('openEntry', { entryId: entry.id });
  }

  async function deleteEntry(entry) {
    if (!confirm('このレコードを削除しますか？ / Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      await axios.delete(`/api/registry/entry/${entry.id}`);
      loadEntries();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  function exportCsv() {
    if (!definition) return;
    window.open(`/api/registry/entries/${definition.id}/export`, '_blank');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString();
  }
</script>

<div class="card shadow-sm border-0">
  <div class="card-header bg-white py-3 border-bottom">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" on:click={() => dispatch('back')}>
          <Icon icon="bi:arrow-left" />
          <BilingualText key="registry_back_to_list" stacked={false} />
        </button>
        <h5 class="mb-0 fw-bold d-flex align-items-center gap-2 text-dark">
          <Icon icon={definition?.icon || 'bi-journal-bookmark'} class="text-primary" />
          <span>{definition?.name}</span>
          <span class="badge bg-light text-secondary border small">{total} records</span>
        </h5>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" on:click={exportCsv}>
          <Icon icon="bi:file-earmark-spreadsheet" />
          <BilingualText key="registry_export_csv" stacked={false} />
        </button>
        <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" on:click={openNewEntry}>
          <Icon icon="bi:plus-lg" />
          <BilingualText key="registry_add_entry" stacked={false} />
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="row g-2 mt-2 pt-2 border-top">
      <div class="col-md-5">
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-light"><Icon icon="bi:search" /></span>
          <input
            type="text"
            class="form-control"
            placeholder="Search / 検索..."
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button class="btn btn-outline-secondary" on:click={handleSearch}>
            <BilingualText key="search" stacked={false} />
          </button>
        </div>
      </div>

      <div class="col-md-3">
        <select class="form-select form-select-sm" bind:value={statusFilter} on:change={handleSearch}>
          <option value="all">すべてのステータス / Tất cả</option>
          <option value="open">対応中 / Open</option>
          <option value="in_progress">処理中 / In Progress</option>
          <option value="pending_review">確認待ち / Review</option>
          <option value="closed_won">完了・成約 / Won</option>
          <option value="closed_lost">終了・見送り / Closed</option>
        </select>
      </div>
    </div>
  </div>

  <div class="card-body p-0">
    {#if errorMsg}
      <div class="alert alert-danger m-3">{errorMsg}</div>
    {/if}

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <div class="mt-2 text-muted">Đang tải dữ liệu sổ bộ...</div>
      </div>
    {:else if entries.length === 0}
      <div class="text-center py-5 text-muted">
        <Icon icon="bi:inbox" style="font-size: 2.5rem;" class="mb-2 text-secondary" />
        <div>Chưa có bản ghi nào trong sổ bộ này.</div>
        <button class="btn btn-outline-primary btn-sm mt-3" on:click={openNewEntry}>
          <Icon icon="bi:plus-lg" class="me-1" />
          <BilingualText key="registry_add_entry" stacked={false} />
        </button>
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-hover table-striped mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 130px;"><BilingualText key="registry_col_code" stacked={false} /></th>
              <th><BilingualText key="registry_col_title" stacked={false} /></th>
              <th style="width: 120px;"><BilingualText key="registry_col_status" stacked={false} /></th>
              <th><BilingualText key="registry_col_company" stacked={false} /></th>
              <th><BilingualText key="registry_col_assignee" stacked={false} /></th>
              {#if definition && definition.schema && definition.schema.fields}
                {#each definition.schema.fields.slice(0, 4) as field}
                  <th>{field.label || field.key}</th>
                {/each}
              {/if}
              <th style="width: 110px;"><BilingualText key="registry_col_created_at" stacked={false} /></th>
              <th style="width: 100px;" class="text-end"><BilingualText key="registry_col_actions" stacked={false} /></th>
            </tr>
          </thead>
          <tbody>
            {#each entries as entry (entry.id)}
              <tr role="button" on:click={() => openEditEntry(entry)}>
                <td><span class="badge bg-light text-dark border font-monospace">{entry.code || `#${entry.id}`}</span></td>
                <td class="fw-semibold text-primary">{entry.title}</td>
                <td>
                  <span class={`badge ${STATUS_BADGES[entry.status]?.class || 'bg-secondary'}`}>
                    {STATUS_BADGES[entry.status]?.label || entry.status}
                  </span>
                </td>
                <td>{entry.company?.name || '-'}</td>
                <td>{entry.user?.legalName || entry.user?.name || '-'}</td>
                {#if definition && definition.schema && definition.schema.fields}
                  {#each definition.schema.fields.slice(0, 4) as field}
                    <td class="small">
                      {#if field.type === 'checkbox'}
                        <Icon icon={entry.data?.[field.key] ? 'bi:check-circle-fill' : 'bi:circle'} class={entry.data?.[field.key] ? 'text-success' : 'text-muted'} />
                      {:else}
                        {entry.data?.[field.key] !== undefined && entry.data?.[field.key] !== null ? entry.data[field.key] : '-'}
                      {/if}
                    </td>
                  {/each}
                {/if}
                <td class="small text-muted">{formatDate(entry.createdAt)}</td>
                <td class="text-end" on:click|stopPropagation>
                  <button class="btn btn-sm btn-outline-primary py-0 px-1 me-1" title="Chỉnh sửa / Timeline" on:click={() => openEditEntry(entry)}>
                    <Icon icon="bi:pencil-square" />
                  </button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1" title="Xóa bản ghi" on:click={() => deleteEntry(entry)}>
                    <Icon icon="bi:trash" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
