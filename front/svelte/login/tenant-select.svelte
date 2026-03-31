<div class="login-page">
  <div class="login-box tenant-select-box">
    <div class="login-logo">
      <img src="/public/logo.png" alt="Logo" class="pe-1">Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <p class="fs-4 text-center">ログイン先を選択</p>
        {#if message}
          <p class="text-{msg_type} text-center">{message}</p>
        {/if}
        <p class="text-muted text-center small mb-3">
          {userName}さん、アクセスする組織を選択してください。
        </p>
        
        {#if isSubmitting}
          <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        {:else}
          <div class="tenant-list">
            {#each tenants as tenant}
              <div 
                class="tenant-card {selectedTenantId === tenant.tenantId ? 'selected' : ''}"
                on:click={() => selectTenant(tenant)}
              >
                <div class="tenant-info">
                  <div class="tenant-name">{tenant.tenantName}</div>
                  <div class="tenant-badges">
                    {#if tenant.isOwner}
                      <span class="badge bg-primary">オーナー</span>
                    {/if}
                    {#if tenant.isDefault}
                      <span class="badge bg-secondary">デフォルト</span>
                    {/if}
                  </div>
                </div>
                <div class="tenant-arrow">
                  <i class="bi bi-chevron-right"></i>
                </div>
              </div>
            {/each}
          </div>
          
          <div class="text-center mt-3">
            <a on:click|preventDefault={logout} href="#" class="text-muted small">
              ログアウト
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
import axios from 'axios';

let userName = '';
let tenants = [];
let selectedTenantId = null;
let message = '';
let msg_type = 'danger';
let isSubmitting = false;

// Fetch tenant list on mount
async function fetchTenants() {
  try {
    const response = await axios.get('/api/user/tenants');
    if (response.data.result === 'OK') {
      userName = response.data.userName;
      tenants = response.data.tenants;
    } else {
      message = response.data.message || 'テナントの取得に失敗しました。';
      msg_type = 'danger';
    }
  } catch (err) {
    console.error('fetch tenants error', err);
    if (err.response?.status === 401) {
      // Not logged in
      window.location = '/login';
    } else {
      message = 'テナントの取得に失敗しました。';
      msg_type = 'danger';
    }
  }
}

fetchTenants();

function selectTenant(tenant) {
  if (isSubmitting) return;
  
  isSubmitting = true;
  message = '';
  
  axios.post('/api/user/select-tenant', { tenantId: tenant.tenantId })
    .then((response) => {
      if (response.data.result === 'OK') {
        // Success — redirect to home
        window.location = '/home';
      } else {
        message = response.data.message || 'テナントの選択に失敗しました。';
        msg_type = 'danger';
        isSubmitting = false;
      }
    })
    .catch((err) => {
      console.error('select tenant error', err);
      message = err.response?.data?.message || 'テナントの選択に失敗しました。';
      msg_type = 'danger';
      isSubmitting = false;
    });
}

function logout() {
  axios.post('/logout')
    .then(() => {
      window.location = '/login';
    })
    .catch(() => {
      window.location = '/login';
    });
}
</script>

<style>
  .tenant-select-box {
    width: 100%;
    max-width: 480px;
  }
  
  @media (min-width: 600px) {
    .tenant-select-box {
      width: 480px;
    }
  }
  
  @media (max-width: 599px) {
    .tenant-select-box {
      width: 95%;
      max-width: none;
    }
  }
  
  .tenant-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .tenant-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #fff;
  }
  
  .tenant-card:hover {
    border-color: #0d6efd;
    background: #f8f9ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
  }
  
  .tenant-card.selected {
    border-color: #0d6efd;
    background: #e8f0ff;
    box-shadow: 0 2px 4px rgba(13, 110, 253, 0.15);
  }
  
  .tenant-info {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  
  .tenant-name {
    font-size: 1rem;
    font-weight: 600;
    color: #212529;
  }
  
  .tenant-badges {
    display: flex;
    gap: 0.4rem;
  }
  
  .tenant-arrow {
    color: #6c757d;
    font-size: 1.1rem;
    transition: transform 0.15s ease;
  }
  
  .tenant-card:hover .tenant-arrow {
    transform: translateX(2px);
    color: #0d6efd;
  }
  
  .badge {
    font-size: 0.7rem;
    padding: 0.25em 0.6em;
    font-weight: 500;
  }
</style>
