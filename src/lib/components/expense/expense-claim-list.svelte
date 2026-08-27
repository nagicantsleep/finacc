<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';

  const dispatch = createEventDispatcher();

  let claims = [];
  let loading = false;
  let errorMsg = '';
  let successMsg = '';
  let activeTab = 'all';
  let searchQuery = '';
  let creatingVoucherId = null;

  onMount(() => {
    loadClaims();
  });

  export async function loadClaims() {
    loading = true;
    errorMsg = '';
    try {
      const res = await axios.get(`/api/expense/claims?allMembers=true&status=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      claims = res.data.claims || [];
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      loading = false;
    }
  }

  function changeTab(tab) {
    activeTab = tab;
    loadClaims();
  }

  async function reviewClaim(claim, status) {
    try {
      await axios.put(`/api/expense/claim/${claim.id}/review`, { status });
      successMsg = `Đã cập nhật trạng thái hồ sơ #${claim.code} thành ${status}.`;
      loadClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  async function createVoucher(claim) {
    creatingVoucherId = claim.id;
    errorMsg = '';
    successMsg = '';
    try {
      const res = await axios.post(`/api/expense/claim/${claim.id}/create-voucher`);
      successMsg = res.data.message;
      loadClaims();
    } catch (err) {
      errorMsg = err.response?.data?.message || err.message;
    } finally {
      creatingVoucherId = null;
    }
  }

  function exportCsv(claim) {
    window.open(`/api/expense/claim/${claim.id}/export`, '_blank');
  }

  function formatCurrency(val) {
    if (!val && val !== 0) return '0';
    return Number(val).toLocaleString();
  }
</script>

<div class="card shadow-sm border-0">
  <div class="card-header bg-white py-3 border-bottom">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
      <!-- Status Tabs -->
      <ul class="nav nav-pills small">
        <li class="nav-item">
          <button class="nav-link {activeTab === 'all' ? 'active' : ''} py-1 px-3" on:click={() => changeTab('all')}>Tất cả</button>
        </li>
        <li class="nav-item">
          <button class="nav-link {activeTab === 'submitted' ? 'active' : ''} py-1 px-3" on:click={() => changeTab('submitted')}>Chờ duyệt</button>
        </li>
        <li class="nav-item">
          <button class="nav-link {activeTab === 'approved' ? 'active' : ''} py-1 px-3" on:click={() => changeTab('approved')}>Đã duyệt</button>
        </li>
        <li class="nav-item">
          <button class="nav-link {activeTab === 'settled' ? 'active' : ''} py-1 px-3" on:click={() => changeTab('settled')}>Đã hạch toán</button>
        </li>
      </ul>

      <!-- Search Box -->
      <div class="d-flex align-items-center gap-2">
        <div class="input-group input-group-sm" style="width: 250px;">
          <input
            type="text"
            class="form-control"
            placeholder="Tìm theo mã hoặc tên..."
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && loadClaims()}
          />
          <button class="btn btn-outline-secondary" on:click={loadClaims}>
            <Icon icon="bi:search" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="card-body p-0">
    {#if errorMsg}
      <div class="alert alert-danger m-3 py-2">{errorMsg}</div>
    {/if}
    {#if successMsg}
      <div class="alert alert-success m-3 py-2">{successMsg}</div>
    {/if}

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <div class="mt-2 text-muted">Đang tải danh sách hồ sơ quyết toán...</div>
      </div>
    {:else if claims.length === 0}
      <div class="text-center py-5 text-muted">
        <Icon icon="bi:file-earmark-x" style="font-size: 3rem;" class="mb-2" />
        <div>Chưa có hồ sơ quyết toán chi phí nào.</div>
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-hover table-striped mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>Mã hồ sơ</th>
              <th>Người nộp</th>
              <th>Tiêu đề & Dự án</th>
              <th>Ngày chi</th>
              <th class="text-end"><BilingualText key="total_expense" stacked={false} /></th>
              <th class="text-end"><BilingualText key="advance_offset" stacked={false} /></th>
              <th class="text-end"><BilingualText key="net_reimbursement" stacked={false} /></th>
              <th>Trạng thái</th>
              <th class="text-end" style="width: 260px;">Thao tác & Kế toán</th>
            </tr>
          </thead>
          <tbody>
            {#each claims as c (c.id)}
              <tr>
                <td class="font-monospace fw-bold text-primary">{c.code}</td>
                <td class="fw-semibold">{c.user?.legalName || c.user?.name}</td>
                <td>
                  <div class="fw-semibold">{c.title}</div>
                  <div class="small text-muted d-flex gap-2 align-items-center">
                    <span>{c.itemCount} dòng chi phí</span>
                    {#if c.project}
                      <span class="badge bg-light text-dark border">{c.project.name}</span>
                    {/if}
                  </div>
                </td>
                <td class="font-monospace small">{c.claimDate}</td>
                <td class="text-end fw-bold">{formatCurrency(c.totalAmount)} đ</td>
                <td class="text-end text-danger">{c.advanceAmount > 0 ? `-${formatCurrency(c.advanceAmount)} đ` : '-'}</td>
                <td class="text-end fw-bold text-success fs-6">{formatCurrency(c.netAmount)} đ</td>
                <td>
                  <span class="badge {c.status === 'settled' ? 'bg-success' : (c.status === 'approved' ? 'bg-primary' : (c.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'))}">
                    {c.status}
                  </span>
                  {#if c.crossSlipId}
                    <div class="small text-muted font-monospace mt-1">Slip #{c.crossSlipId}</div>
                  {/if}
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Xuất CSV" on:click={() => exportCsv(c)}>
                      <Icon icon="bi:file-earmark-spreadsheet" />
                    </button>

                    {#if c.status === 'submitted'}
                      <button class="btn btn-sm btn-success py-0 px-2" on:click={() => reviewClaim(c, 'approved')}>
                        <BilingualText key="approve" stacked={false} />
                      </button>
                      <button class="btn btn-sm btn-danger py-0 px-2" on:click={() => reviewClaim(c, 'rejected')}>
                        <BilingualText key="reject" stacked={false} />
                      </button>
                    {/if}

                    {#if (c.status === 'approved' || c.status === 'submitted') && !c.crossSlipId}
                      <button
                        class="btn btn-sm btn-warning text-dark fw-bold py-0 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                        on:click={() => createVoucher(c)}
                        disabled={creatingVoucherId === c.id}
                      >
                        <Icon icon="bi:journal-plus" />
                        <BilingualText key="accounting_voucher_create" stacked={false} />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
