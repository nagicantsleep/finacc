<script>
  import { onMount } from 'svelte';
  import axios from 'axios';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
  export let toast;
  export let title = $bi('system_settings');
  export let minimize = true;

  let company = {};
  let useProjectAccounting = false;
  let showIntercompanyAsSundries = false;

  onMount(async () => {
    try {
      const res = await axios.get('/api/company/info');
      company = res.data.company || {};
      useProjectAccounting = company.useProjectAccounting || false;
      showIntercompanyAsSundries = company.showIntercompanyAsSundries || false;
    } catch (error) {
      console.error(error);
      toast.show($bi('system_settings'), $bi('system_settings_load_fail'));
    }
  });

  const handleChange = async () => {
    console.log({company});
    try {
      const updatedCompany = { ...company, useProjectAccounting, showIntercompanyAsSundries };
      await axios.put('/api/company/info', updatedCompany);
      company = updatedCompany;
      toast.show($bi('system_settings'), $bi('system_settings_save_ok'));
    } catch (error) {
      console.error(error);
      toast.show($bi('system_settings'), $bi('system_settings_save_fail'));
      // 変更を元に戻す
      useProjectAccounting = company.useProjectAccounting || false;
      showIntercompanyAsSundries = company.showIntercompanyAsSundries || false;
    }
  };
</script>

<div class="card">
  <div class="card-header d-flex">
    <h5 class="card-title">{title}</h5>
    <div class="d-flex ms-auto">
      <button type="button" class="btn"
        on:click={() => {
          minimize = !minimize;
        }}>
        {#if minimize}
        <i class="bi bi-square"></i>
        {:else}
        <i class="bi bi-dash-square"></i>
        {/if}
      </button>
    </div>
  </div>
  {#if !minimize}
  <div class="card-body">
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" id="useProjectAccountingSwitch" bind:checked={useProjectAccounting} on:change={handleChange}>
      <label class="form-check-label" for="useProjectAccountingSwitch"><BilingualText key="enable_projects" /></label>
    </div>
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" id="showIntercompanyAsSundriesSwitch" bind:checked={showIntercompanyAsSundries} on:change={handleChange}>
      <label class="form-check-label" for="showIntercompanyAsSundriesSwitch"><BilingualText key="show_sundries" /></label>
    </div>
  </div>
  {/if}
</div>
