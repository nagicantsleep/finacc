<div class="container-fluid">
  <ul class="navbar-nav">
  </ul>
  <span class="havbar-text">
    {#if ( status.fy.startDate && status.fy.endDate )}
    第{status.fy.term}期
    ({status.fy.startDate.getFullYear()}年
    ({wareki(status.fy.startDate)})
        {status.fy.startDate.getMonth()+1}月
        {status.fy.startDate.getDate()}日
    〜
    {status.fy.endDate.getFullYear()}年
    ({wareki(status.fy.endDate)})
        {status.fy.endDate.getMonth()+1}月
        {status.fy.endDate.getDate()}日)
    {:else}
    <span class="text-danger fw-bold"><i class="bi bi-exclamation-diamond-fill"></i>&nbsp; 会計年度を選択してください</span>
    {/if}
  </span>
  <ul class="navbar-nav ms-auto">
    <li class="nav-item dropdown">
      <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" id="user_menu"
          role="button" aria-expanded="false">
        <span class="d-none d-md-inline">{status.user.name}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end"
          aria-labelledby="user_menu">
        <li>
          <a href="#" class="dropdown-item" on:click|preventDefault={openProfile}>
            <i class="bi bi-person-circle me-1"></i>プロフィール
          </a>
        </li>
        <li>
          <a href="#" class="dropdown-item" on:click|preventDefault={switchTenantFromApp}>
            <i class="bi bi-arrow-left-right me-1"></i>テナント切替
            {#if switchingTenant}
              <span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
            {/if}
          </a>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <a href="/logout" class="dropdown-item">
            <i class="bi bi-power me-1"></i>Sign out
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

export let status;

let profileModal;
let switchingTenant = false;

const openProfile = () => profileModal?.show();

const onProfileUpdated = (event) => {
  status.user = { ...status.user, ...event.detail };
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
