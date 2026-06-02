<div class="logon-page">
  <TenantSelect></TenantSelect>
  <div class="logon-manage card mt-4">
    <div class="card-body">
      <h5 class="card-title mb-3"><BilingualText key="manage_owned_tenants" /></h5>
      {#if manageMessage}
        <p class="text-{manageMessageType} mb-3">{manageMessage}</p>
      {/if}
      <div class="input-group mb-3">
        <input class="form-control" bind:value={newTenantName} placeholder={$bi('new_tenant_name')}>
        <button class="btn btn-outline-primary" on:click={createTenant} disabled={submittingCreate}><BilingualText key="create_btn" /></button>
      </div>

      <div class="tenant-manage-list">
        {#each ownedTenants as tenant}
          <div class="tenant-manage-item">
            <input class="form-control" bind:value={tenant.tenantName}>
            <div class="tenant-manage-actions">
              <button class="btn btn-outline-secondary" on:click={() => updateTenant(tenant)} disabled={tenant.saving}><BilingualText key="update" /></button>
              <button class="btn btn-outline-danger" on:click={() => deleteTenant(tenant)} disabled={tenant.saving}><BilingualText key="delete" /></button>
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

import { bi } from '../javascripts/bilingual.js';
import BilingualText from './components/bilingual-text.svelte';
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
    manageMessage = err.response?.data?.message || $bi('tenant_fetch_failed');
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
      manageMessage = $bi('tenant_created_msg');
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || $bi('tenant_create_failed_msg');
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || $bi('tenant_create_failed_msg');
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
      manageMessage = $bi('tenant_updated_msg');
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || $bi('tenant_update_failed_msg');
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || $bi('tenant_update_failed_msg');
    manageMessageType = 'danger';
  }
  tenant.saving = false;
}

async function deleteTenant(tenant) {
  if (tenant.saving) return;
  if (!window.confirm(`「${tenant.tenantName}」${$bi('confirm_delete_tenant_suffix')}`)) return;
  tenant.saving = true;
  manageMessage = '';
  try {
    const response = await axios.delete(`/api/user/tenant/${tenant.tenantId}`);
    if (response.data.result === 'OK') {
      manageMessage = $bi('tenant_deleted_msg');
      manageMessageType = 'success';
      await loadOwnedTenants();
    } else {
      manageMessage = response.data.message || $bi('tenant_delete_failed_msg');
      manageMessageType = 'danger';
    }
  } catch (err) {
    manageMessage = err.response?.data?.message || $bi('tenant_delete_failed_msg');
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