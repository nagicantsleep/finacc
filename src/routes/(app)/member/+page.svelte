<script>
  export let data;
</script>

<svelte:head>
  <title>役職員・メンバー管理 :: Hieronymus</title>
</svelte:head>

<div class="container-fluid">
  <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <h3 class="fw-bold mb-0">役職員・メンバー管理 (Members)</h3>
  </div>

  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 25%;">氏名 / アカウント名</th>
              <th style="width: 30%;">メールアドレス</th>
              <th style="width: 25%;">権限 / 役割</th>
              <th style="width: 20%;">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {#each data.members as mem}
              <tr>
                <td>
                  <div class="fw-bold">{mem.name}</div>
                  <small class="text-muted">{mem.legalName}</small>
                </td>
                <td class="font-monospace">{mem.email}</td>
                <td>
                  {#if mem.isOwner}
                    <span class="badge bg-danger me-1">オーナー</span>
                  {/if}
                  {#if mem.accounting}
                    <span class="badge bg-primary me-1">会計権限</span>
                  {/if}
                  {#if mem.approvable}
                    <span class="badge bg-success me-1">承認権限</span>
                  {/if}
                </td>
                <td>
                  <span class="badge bg-success">{mem.status}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
