<script>
  import { onMount } from 'svelte';
  import axios from 'axios';
  import { formatFiscalHeader } from '$lib/utils.js';
  import ProfileModal from '$lib/components/common/profile-modal.svelte';
  import LanguagePairSelector from '$lib/components/widgets/language-pair-selector.svelte';
  import BilingualText from '$lib/components/BilingualText.svelte';
  import { bi, languagePair } from '$lib/i18n/bilingual.js';

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
    secondary: formatFiscalHeader(fyObj, $languagePair?.secondary || 'vi')
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
  <div class="brand-container">
    <a href="/workspace" class="brand-link">
      <img src="/logo.png" alt="Logo" class="brand-image" />
      <span class="brand-text">Hieronymus</span>
    </a>
  </div>

  <nav class="main-header navbar navbar-expand-lg">
    <div class="container-fluid">
      <span class="navbar-text text-light">
        {#if fyObj.startDate && fyObj.endDate}
          {#if fiscalHeader.primary === fiscalHeader.secondary}
            {fiscalHeader.primary}
          {:else}
            {fiscalHeader.primary} / {fiscalHeader.secondary}
          {/if}
        {:else}
          <span class="text-danger fw-bold">
            <i class="bi bi-exclamation-diamond-fill me-1"></i>
            <BilingualText key="select_fiscal_year" />
          </span>
        {/if}
      </span>

      <ul class="navbar-nav ms-auto align-items-center">
        <li class="nav-item me-2">
          <LanguagePairSelector />
        </li>
        <li class="nav-item dropdown">
          <a
            href="#"
            class="nav-link dropdown-toggle user-menu-toggle text-light"
            data-bs-toggle="dropdown"
            id="user_menu"
            role="button"
            aria-expanded="false"
          >
            <span class="user-avatar" aria-hidden="true" title={user.name}>
              {(user.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span class="d-none d-md-inline user-menu-name">{user.name || 'User'}</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="user_menu">
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
