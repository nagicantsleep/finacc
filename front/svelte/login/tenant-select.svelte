<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <img src="/public/logo.png" alt="Logo" class="pe-1">Hieronymus
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <p class="fs-4 text-center">ログイン先を選択</p>
        <p class="text-muted text-center mb-4">
          {userName} さん、アクセスする組織を選択してください。
        </p>
        
        {#if tenants.length > 0}
          <div class="list-group mb-3">
            {#each tenants as tenant}
              <button 
                class="list-group-item list-group-item-action"
                on:click={() => selectTenant(tenant.tenantId)}
                disabled={isSelecting}>
                <div class="d-flex w-100 justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{tenant.tenantName}</h6>
                    <small class="text-muted">
                      {#if tenant.isOwner}
                        <span class="badge bg-primary me-1">オーナー</span>
                      {/if}
                      {#if tenant.isDefault}
                        <span class="badge bg-success">デフォルト</span>
                      {/if}
                    </small>
                  </div>
                  <i class="fas fa-chevron-right text-muted"></i>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <p class="text-center text-muted">組織が見つかりません。</p>
        {/if}
        
        <div class="text-center">
          <a href="#" on:click|preventDefault={logout} class="text-muted">
            <i class="fas fa-sign-out-alt me-1"></i>ログアウト
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
import {onMount} from 'svelte';
import axios from 'axios';

let tenants = [];
let userName = '';
let isSelecting = false;

onMount(async () => {
  try {
    const response = await axios.get('/api/user/tenants');
    
    if (response.data.result === 'OK') {
      tenants = response.data.tenants;
      userName = response.data.userName;
    } else {
      console.error('Failed to fetch tenants');
      window.location = '/login';
    }
  } catch (err) {
    console.error('tenant fetch error', err);
    window.location = '/login';
  }
});

const selectTenant = async (tenantId) => {
  isSelecting = true;
  
  try {
    const response = await axios.post('/api/user/select-tenant', {
      tenantId
    });
    
    if (response.data.result === 'OK') {
      window.location = '/home';
    } else {
      alert('テナントの選択に失敗しました。');
      isSelecting = false;
    }
  } catch (err) {
    console.error('tenant selection error', err);
    alert('テナントの選択に失敗しました。');
    isSelecting = false;
  }
}

const logout = async () => {
  try {
    await axios.post('/api/user/logout');
    window.location = '/login';
  } catch (err) {
    console.error('logout error', err);
    window.location = '/login';
  }
}
</script>

<style>
.list-group-item:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
</style>
