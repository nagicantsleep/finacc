<script>
  import Header from '$lib/components/layout/Header.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import CommonFooter from '$lib/components/common/footer.svelte';

  export let data;
</script>

<div class="wrapper">
  <Header
    user={data.user}
    tenant={data.tenant}
    currentFy={data.currentFy}
    fiscalYears={data.fiscalYears}
  />

  <Sidebar
    user={data.user}
    company={data.company}
    currentFy={data.currentFy}
  />

  <main class="content-wrapper">
    <div class="container-fluid">
      <div class="content">
        <slot />
      </div>
    </div>
  </main>

  <footer class="main-footer d-print-none">
    <CommonFooter />
  </footer>
</div>
