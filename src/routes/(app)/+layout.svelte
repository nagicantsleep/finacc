<script>
  import Header from '$lib/components/layout/Header.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';

  export let data;
</script>

<div class="erp-wrapper min-vh-100 d-flex flex-column bg-light">
  <Header
    user={data.user}
    tenant={data.tenant}
    currentFy={data.currentFy}
    fiscalYears={data.fiscalYears}
  />

  <div class="d-flex flex-grow-1">
    <div class="d-none d-md-block d-print-none">
      <Sidebar />
    </div>
    <main class="flex-grow-1 p-3 p-md-4 overflow-auto">
      <slot />
    </main>
  </div>
</div>
