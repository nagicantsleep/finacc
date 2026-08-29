<script>
  import Header from '$lib/components/layout/Header.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import CommonFooter from '$lib/components/common/footer.svelte';
  import { sidebarCollapsed } from '$lib/client/ui.js';

  export let data;

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      sidebarCollapsed.set(true);
    }
  };
</script>

<div class="wrapper {$sidebarCollapsed ? 'sidebar-collapse' : 'sidebar-open'}">
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

  <!-- Mobile Backdrop for drawer overlay -->
  {#if !$sidebarCollapsed}
    <div
      class="sidebar-backdrop d-md-none"
      on:click={closeSidebarOnMobile}
      on:keydown={(e) => e.key === 'Escape' && closeSidebarOnMobile()}
      role="button"
      tabindex="0"
      aria-label="Close sidebar"
    ></div>
  {/if}

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
