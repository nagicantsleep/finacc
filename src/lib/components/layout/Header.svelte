<script>
  export let user = {};
  export let tenant = {};
  export let currentFy = {};
  export let fiscalYears = [];
</script>

<header class="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow-sm border-bottom border-dark-subtle sticky-top">
  <div class="container-fluid d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <a class="navbar-brand fw-bold d-flex align-items-center me-4" href="/home">
        <img src="/logo.png" alt="Hieronymus" style="height: 28px;" class="me-2" />
        <span>Hieronymus</span>
      </a>
      <div class="d-flex align-items-center">
        <span class="badge bg-primary text-wrap me-2 fs-6">{tenant.name || 'テナント'}</span>
        {#if currentFy?.term}
          <span class="badge bg-secondary">第 {currentFy.term} 期 ({currentFy.year}年度)</span>
        {/if}
      </div>
    </div>

    <div class="d-flex align-items-center gap-3">
      {#if fiscalYears && fiscalYears.length > 1}
        <form method="GET" class="d-flex align-items-center">
          <select name="term" class="form-select form-select-sm bg-dark text-light border-secondary" on:change={(e) => e.target.form.submit()}>
            {#each fiscalYears as fy}
              <option value={fy.term} selected={fy.term === currentFy.term}>第 {fy.term} 期 ({fy.year}年)</option>
            {/each}
          </select>
        </form>
      {/if}

      <div class="text-light small d-none d-md-block">
        <i class="bi bi-person-circle me-1"></i> {user.name}
      </div>

      <div class="btn-group">
        <a href="/logon" class="btn btn-outline-light btn-sm" title="組織・テナント切替">
          <i class="bi bi-arrow-left-right me-1"></i> 切替
        </a>
        <form action="/logon?/logout" method="POST" class="d-inline">
          <button type="submit" class="btn btn-outline-danger btn-sm" title="ログアウト">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</header>
