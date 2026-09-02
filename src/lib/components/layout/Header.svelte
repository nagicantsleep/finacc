<script>
  import { onMount, tick } from 'svelte';
  import axios from 'axios';
  import { formatFiscalHeader, formatFiscalCompact, formatFiscalBadge } from '$lib/utils.js';
  import ProfileModal from '$lib/components/common/profile-modal.svelte';
  import LanguagePairSelector from '$lib/components/widgets/language-pair-selector.svelte';
  import BilingualText from '$lib/components/BilingualText.svelte';
  import { bi, languagePair } from '$lib/i18n/bilingual.js';
  import { sidebarCollapsed } from '$lib/client/ui.js';

  export let user = {};
  export let tenant = {};
  export let currentFy = {};
  export let fiscalYears = [];

  let profileModal;
  let switchingTenant = false;
  let creatingTenant = false;
  let userMenuOpen = false;
  let userMenuRoot;
  let userMenuBtn;
  let userMenuStyle = '';

  $: fyObj = currentFy ? {
    term: currentFy.term,
    year: currentFy.year,
    startDate: currentFy.startDate ? new Date(currentFy.startDate) : null,
    endDate: currentFy.endDate ? new Date(currentFy.endDate) : null
  } : {};

  $: fiscalHeader = {
    primary: formatFiscalHeader(fyObj, $languagePair?.primary || 'ja'),
    secondary: formatFiscalHeader(fyObj, $languagePair?.secondary || 'vi'),
    compact: formatFiscalCompact(fyObj, $languagePair?.primary || 'ja'),
    badge: formatFiscalBadge(fyObj, $languagePair?.primary || 'ja'),
    tooltip: `${formatFiscalHeader(fyObj, $languagePair?.primary || 'ja')} / ${formatFiscalHeader(fyObj, $languagePair?.secondary || 'vi')}`
  };

  const openSidebar = () => {
    sidebarCollapsed.set(false);
  };

  const openProfile = () => {
    closeUserMenu();
    profileModal?.show();
  };

  const onProfileUpdated = (event) => {
    user = { ...user, ...event.detail };
  };

  const openTenantCreate = async () => {
    closeUserMenu();
    if (creatingTenant) return;
    const name = window.prompt($bi('nav_tenant_name_prompt'));
    if (!name?.trim()) return;

    const slug = window.prompt($bi('nav_tenant_slug_prompt')) || '';
    creatingTenant = true;
    try {
      const res = await axios.post('/api/tenant', {
        name: name.trim(),
        slug: slug.trim() || undefined
      });
      if (res.data.result !== 'OK') {
        window.alert(res.data.message || $bi('nav_tenant_create_fail'));
        return;
      }
      window.location.reload();
    } catch (err) {
      window.alert(err.response?.data?.message || $bi('nav_tenant_create_fail'));
    } finally {
      creatingTenant = false;
    }
  };

  const switchTenantFromApp = async () => {
    closeUserMenu();
    if (switchingTenant) return;
    switchingTenant = true;
    try {
      const res = await axios.post('/api/user/logoff');
      if (res.data.result !== 'OK') {
        switchingTenant = false;
        return;
      }
      window.location = res.data.action === 'logout' ? '/login' : '/logon';
    } catch (err) {
      console.error('tenant switch error', err);
      switchingTenant = false;
    }
  };

  async function positionUserMenu() {
    await tick();
    if (!userMenuBtn) return;
    const rect = userMenuBtn.getBoundingClientRect();
    userMenuStyle = `top:${rect.bottom + 4}px;left:${rect.right}px;transform:translateX(-100%);`;
  }

  async function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
    if (userMenuOpen) {
      await positionUserMenu();
    }
  }

  function closeUserMenu() {
    userMenuOpen = false;
  }

  function handleDocumentClick(event) {
    if (userMenuOpen && userMenuRoot && !userMenuRoot.contains(event.target)) {
      closeUserMenu();
    }
  }

  function handleDocumentKeydown(event) {
    if (userMenuOpen && event.key === 'Escape') {
      closeUserMenu();
    }
  }

  onMount(() => {
    const reposition = () => {
      if (userMenuOpen) positionUserMenu();
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  });
</script>

<div class="topbar">
  <div class="brand-container {$sidebarCollapsed ? 'collapsed' : ''}">
    {#if $sidebarCollapsed}
      <button
        type="button"
        class="btn btn-link mobile-sidebar-open-btn d-md-none p-0 me-1"
        on:click={openSidebar}
        title="Open sidebar"
        aria-label="Open sidebar"
      >
        <i class="bi bi-layout-sidebar-inset" aria-hidden="true"></i>
      </button>
    {/if}
    <a href="/workspace" class="brand-link">
      <img src="/logo.png" alt="Logo" class="brand-image" />
      <span class="brand-text">Hieronymus</span>
    </a>
  </div>

  <nav class="main-header navbar navbar-expand">
    <div class="container-fluid d-flex flex-nowrap align-items-center justify-content-between px-1 px-sm-2 px-md-3">
      <!-- Fiscal Year Info (Progressive Responsive Display) -->
      <div class="header-fiscal-info text-truncate me-1 me-md-2" title={fiscalHeader.tooltip}>
        {#if fyObj.startDate && fyObj.endDate}
          <!-- Desktop Full (>= 1200px) -->
          <span class="d-none d-xl-inline navbar-text text-light fiscal-full text-truncate">
            {#if fiscalHeader.primary === fiscalHeader.secondary}
              {fiscalHeader.primary}
            {:else}
              {fiscalHeader.primary} / {fiscalHeader.secondary}
            {/if}
          </span>
          <!-- Tablet / Small Desktop (768px - 1199px) -->
          <span class="d-none d-md-inline d-xl-none navbar-text text-light fiscal-compact text-truncate">
            <i class="bi bi-calendar-event me-1 text-info"></i>
            {fiscalHeader.compact}
          </span>
          <!-- Mobile (< 768px) -->
          <span class="d-inline d-md-none badge bg-dark border border-secondary text-light fiscal-badge">
            <i class="bi bi-calendar3 me-1 text-info"></i>
            {fiscalHeader.badge}
          </span>
        {:else}
          <span class="text-danger fw-bold fs-7">
            <i class="bi bi-exclamation-diamond-fill me-1"></i>
            <BilingualText key="select_fiscal_year" />
          </span>
        {/if}
      </div>

      <!-- Right Side Actions: Language Selector & User Menu -->
      <ul class="navbar-nav align-items-center flex-row flex-nowrap ms-auto">
        <li class="nav-item me-1 me-md-2">
          <LanguagePairSelector />
        </li>
        <li class="nav-item user-menu-root" bind:this={userMenuRoot}>
          <button
            type="button"
            class="nav-link user-menu-toggle text-light p-1 px-md-2 border-0 bg-transparent"
            bind:this={userMenuBtn}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            on:click|stopPropagation={toggleUserMenu}
          >
            <span class="user-avatar" aria-hidden="true" title={user.name}>
              {(user.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span class="d-none d-lg-inline user-menu-name ms-1">{user.name || 'User'}</span>
            <i class="bi bi-chevron-down ms-1 user-menu-caret" aria-hidden="true"></i>
          </button>
          {#if userMenuOpen}
            <ul class="user-menu-dropdown" style={userMenuStyle} role="menu" aria-labelledby="user_menu">
              <li role="none">
                <button type="button" class="dropdown-item" role="menuitem" on:click={openProfile}>
                  <i class="bi bi-person-circle me-2"></i>
                  <BilingualText key="profile" />
                </button>
              </li>
              <li role="none">
                <button type="button" class="dropdown-item" role="menuitem" on:click={openTenantCreate}>
                  <i class="bi bi-building-add me-2"></i>
                  <BilingualText key="create_tenant" />
                </button>
              </li>
              <li role="none">
                <button type="button" class="dropdown-item" role="menuitem" on:click={switchTenantFromApp}>
                  <i class="bi bi-arrow-left-right me-2"></i>
                  <BilingualText key="nav_tenant_switch" />
                  {#if switchingTenant}
                    <span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
                  {/if}
                </button>
              </li>
              <li role="separator"><hr class="dropdown-divider" /></li>
              <li role="none">
                <form action="/logon?/logout" method="POST" class="d-block m-0 p-0">
                  <button type="submit" class="dropdown-item text-danger">
                    <i class="bi bi-power me-2"></i>
                    <BilingualText key="nav_sign_out" />
                  </button>
                </form>
              </li>
            </ul>
          {/if}
        </li>
      </ul>
    </div>
  </nav>
</div>

<ProfileModal bind:this={profileModal} {user} on:updated={onProfileUpdated} />

<style>
  .user-menu-caret {
    font-size: 0.7rem;
    opacity: 0.85;
  }
</style>
