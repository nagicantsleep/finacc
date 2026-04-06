<div class="logon-page">
  <TenantSelect></TenantSelect>
  <div class="logon-manage card mt-4">
    <div class="card-body">
      <h5 class="card-title mb-3">所有テナント管理</h5>
      {#if manageMessage}
        <p class="text-{manageMessageType} mb-3">{manageMessage}</p>
      {/if}
      <div class="input-group mb-3">
        <input class="form-control" bind:value={newTenantName} placeholder="新しいテナント名">
        <button class="btn btn-outline-primary" on:click={createTenant} disabled={submittingCreate}>作成</button>
      </div>

      <div class="tenant-manage-list">
        {#each ownedTenants as tenant}
          <div class="tenant-manage-item">
            <input class="form-control" bind:value={tenant.tenantName}>
            <div class="tenant-manage-actions">
              <button class="btn btn-outline-secondary" on:click={() => updateTenant(tenant)} disabled={tenant.saving}>更新</button>
              <button class="btn btn-outline-danger" on:click={() => deleteTenant(tenant)} disabled={tenant.saving}>削除</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<script>
import axios from 'axios';
import TenantSelect from './login/tenant-select.svelte';

let ownedTenants = [];
let newTenantName = '';
let manageMessage = '';
let manageMessageType = 'danger';
let submittingCreate = false;

async function loadOwnedTenants() {
  try {
    const response = await axios.get('/api/user/tenants');
    if (response.data.result === 'OK') {
      ownedTenants = response.data.tenants
        .filter((tenant) => tenant.isOwner)
        .map((tenant) => ({ ...tenant, saving: false }));
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || '所有テナントの取得に失敗しました。';
    manageMessageType = 'danger';
  }
}

async function createTenant() {
  if (!newTenantName.trim() || submittingCreate) return;
  submittingCreate = true;
  manageMessage = '';
  try {
    const response = await axios.post('/api/user/tenant', { name: newTenantName });
    if (response.data.result === 'OK') {
      newTenantName = '';
      manageMessage = 'テナントを作成しました。';
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || 'テナントの作成に失敗しました。';
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || 'テナントの作成に失敗しました。';
    manageMessageType = 'danger';
  }
  submittingCreate = false;
}

async function updateTenant(tenant) {
  if (!tenant.tenantName?.trim() || tenant.saving) return;
  tenant.saving = true;
  manageMessage = '';
  try {
    const response = await axios.put(`/api/user/tenant/${tenant.tenantId}`, { name: tenant.tenantName });
    if (response.data.result === 'OK') {
      manageMessage = 'テナントを更新しました。';
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || 'テナントの更新に失敗しました。';
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || 'テナントの更新に失敗しました。';
    manageMessageType = 'danger';
  }
  tenant.saving = false;
}

async function deleteTenant(tenant) {
  if (tenant.saving) return;
  if (!window.confirm(`「${tenant.tenantName}」を削除しますか？`)) return;
  tenant.saving = true;
  manageMessage = '';
  try {
    const response = await axios.delete(`/api/user/tenant/${tenant.tenantId}`);
    if (response.data.result === 'OK') {
      manageMessage = 'テナントを削除しました。';
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || 'テナントの削除に失敗しました。';
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || 'テナントの削除に失敗しました。';
    manageMessageType = 'danger';
  }
  tenant.saving = false;
}

loadOwnedTenants();
</script>

<style>
  .logon-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2rem;
  }

  .logon-manage {
    width: min(95%, 480px);
  }

  .tenant-manage-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tenant-manage-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }

  .tenant-manage-actions {
    display: flex;
    gap: 0.5rem;
  }
</style>