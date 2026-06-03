<div class="container-fluid">
  <ul class="navbar-nav">
  </ul>
  <span class="havbar-text">
    {#if ( status.fy.startDate && status.fy.endDate )}
    {$bi('term')}{status.fy.term}{$bi('period_suffix')}
    ({status.fy.startDate.getFullYear()}{$bi('nav_year_suffix')}
    ({wareki(status.fy.startDate)})
        {status.fy.startDate.getMonth()+1}{$bi('nav_month_suffix')}
        {status.fy.startDate.getDate()}{$bi('nav_day_suffix')}
    〜
    {status.fy.endDate.getFullYear()}{$bi('nav_year_suffix')}
    ({wareki(status.fy.endDate)})
        {status.fy.endDate.getMonth()+1}{$bi('nav_month_suffix')}
        {status.fy.endDate.getDate()}{$bi('nav_day_suffix')})
    {:else}
    <span class="text-danger fw-bold"><i class="bi bi-exclamation-diamond-fill"></i><BilingualText key="select_fiscal_year" /></span>
    {/if}
  </span>
  <ul class="navbar-nav ms-auto align-items-center">
    <li class="nav-item">
      <LanguagePairSelector />
    </li>
    <li class="nav-item dropdown">
      <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" id="user_menu"
          role="button" aria-expanded="false">
        <span class="d-none d-md-inline">{status.user.name}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end"
          aria-labelledby="user_menu">
        <li>
          <a href="#" class="dropdown-item" on:click|preventDefault={openProfile}>
            <i class="bi bi-person-circle me-1"></i><BilingualText key="profile" /></a>
        </li>
        <li>
          <a href="#" class="dropdown-item" on:click|preventDefault={openTenantCreate}>
            <i class="bi bi-building-add me-1"></i><BilingualText key="create_tenant" /></a>
        </li>
        <li>
          <a href="#" class="dropdown-item" on:click|preventDefault={switchTenantFromApp}>
            <i class="bi bi-arrow-left-right me-1"></i><BilingualText key="nav_tenant_switch" />
            {#if switchingTenant}
              <span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
            {/if}
          </a>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <a href="/logout" class="dropdown-item">
            <i class="bi bi-power me-1"></i><BilingualText key="nav_sign_out" />
          </a>
        </li>
      </ul>
    </li>
  </ul>
</div>

<ProfileModal bind:this={profileModal} user={status.user} on:updated={onProfileUpdated} />

<script>
import axios from 'axios';
import {wareki} from '../../../libs/utils';
import ProfileModal from './profile-modal.svelte';
import LanguagePairSelector from '../widgets/language-pair-selector.svelte';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
export let status;

let profileModal;
let switchingTenant = false;
let creatingTenant = false;

const openProfile = () => profileModal?.show();

const onProfileUpdated = (event) => {
  status.user = { ...status.user, ...event.detail };
};

const openTenantCreate = async () => {
  if (creatingTenant) {
    return;
  }

  const name = window.prompt($bi('nav_tenant_name_prompt'));
  if (!name?.trim()) {
    return;
  }

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
  if (switchingTenant) {
    return;
  }

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
