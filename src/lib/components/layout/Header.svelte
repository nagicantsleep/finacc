<script>
  import { onMount } from 'svelte';
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

  const toggleSidebar = () => {
    sidebarCollapsed.update((c) => !c);
  };

  const openProfile = () => profileModal?.show();

  const onProfileUpdated = (event) => {
    user = { ...user, ...event.detail };
  };

  const openTenantCreate = async () => {
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
</script>

<div class="topbar">
  <div class="brand-container {$sidebarCollapsed ? 'collapsed' : ''}">
    <button
      type="button"
      class="btn btn-link text-light pushmenu-btn p-0 me-1"
      on:click={toggleSidebar}
      title="Toggle sidebar"
      aria-label="Toggle sidebar"
    >
      <i class="bi bi-list fs-4"></i>
    </button>
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
        <li class="nav-item dropdown">
          <a
            href="#"
            class="nav-link dropdown-toggle user-menu-toggle text-light p-1 px-md-2"
            data-bs-toggle="dropdown"
            id="user_menu"
            role="button"
            aria-expanded="false"
          >
            <span class="user-avatar" aria-hidden="true" title={user.name}>
              {(user.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span class="d-none d-lg-inline user-menu-name ms-1">{user.name || 'User'}</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="user_menu">
            <li>
              <a href="#" class="dropdown-item" on:click|preventDefault={openProfile}>
                <i class="bi bi-person-circle me-2"></i>
                <BilingualText key="profile" stacked={false} />
              </a>
            </li>
            <li>
              <a href="#" class="dropdown-item" on:click|preventDefault={openTenantCreate}>
                <i class="bi bi-building-add me-2"></i>
                <BilingualText key="create_tenant" stacked={false} />
              </a>
            </li>
            <li>
              <a href="#" class="dropdown-item" on:click|preventDefault={switchTenantFromApp}>
                <i class="bi bi-arrow-left-right me-2"></i>
                <BilingualText key="nav_tenant_switch" stacked={false} />
                {#if switchingTenant}
                  <span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
                {/if}
              </a>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <form action="/logon?/logout" method="POST" class="d-block m-0 p-0">
                <button type="submit" class="dropdown-item text-danger">
                  <i class="bi bi-power me-2"></i>
                  <BilingualText key="nav_sign_out" stacked={false} />
                </button>
              </form>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </nav>
</div>

<ProfileModal bind:this={profileModal} {user} on:updated={onProfileUpdated} />
