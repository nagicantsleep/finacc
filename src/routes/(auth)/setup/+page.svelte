<script>
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import axios from 'axios';
  import BilingualText from '$lib/components/BilingualText.svelte';
  import LanguagePairSelector from '$lib/components/widgets/language-pair-selector.svelte';
  import { bi, languagePair } from '$lib/i18n/bilingual.js';

  export let data;
  export let form;

  let isSubmitting = false;

  $: pageTitle = `${$bi('setup_wizard_title')} :: Hieronymus`;

  onMount(async () => {
    try {
      const langRes = await axios.get('/api/user/language-pair');
      if (langRes.data?.languagePair) {
        languagePair.set(langRes.data.languagePair);
      }
    } catch (e) {
      console.log('language-pair fetch failed, using default', e);
    }
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div class="setup-page d-flex justify-content-center align-items-center min-vh-100 bg-light py-5">
  <div class="card shadow-sm border-0" style="width: 100%; max-width: 580px;">
    <div class="card-body p-4 p-md-5">
      <div class="d-flex justify-content-end mb-2">
        <LanguagePairSelector tone="card" />
      </div>

      <div class="text-center mb-4">
        <img src="/logo.png" alt="Logo" style="height: 42px;" class="mb-2" />
        <h3 class="fw-bold"><BilingualText key="setup_wizard_title" /></h3>
        <p class="text-muted"><BilingualText key="setup_wizard_subtitle" /></p>
      </div>

      {#if form?.errorKey}
        <div class="alert alert-danger py-2 text-center" role="alert">
          <BilingualText key={form.errorKey} stacked={false} />
        </div>
      {:else if form?.error}
        <div class="alert alert-danger py-2 text-center" role="alert">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            isSubmitting = false;
            await update();
          };
        }}
      >
        <div class="mb-4">
          <h5 class="border-bottom pb-2 mb-3"><BilingualText key="setup_section_fiscal_period" stacked={false} /></h5>
          <div class="row g-3">
            <div class="col-6">
              <label for="startDate" class="form-label"><BilingualText key="start_date" /></label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                class="form-control"
                value={data.defaultStartDate}
                required
              />
            </div>
            <div class="col-6">
              <label for="endDate" class="form-label"><BilingualText key="end_date" /></label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                class="form-control"
                value={data.defaultEndDate}
                required
              />
            </div>
            <div class="col-6">
              <label for="term" class="form-label"><BilingualText key="setup_term_number_label" /></label>
              <input
                id="term"
                name="term"
                type="number"
                class="form-control"
                value={data.defaultTerm}
                min="1"
                required
              />
            </div>
            <div class="col-6">
              <label for="year" class="form-label"><BilingualText key="setup_year_label" /></label>
              <input
                id="year"
                name="year"
                type="number"
                class="form-control"
                value={data.defaultYear}
                required
              />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <h5 class="border-bottom pb-2 mb-3"><BilingualText key="setup_section_business_accounts" stacked={false} /></h5>
          <div class="mb-3">
            <label for="companyClass" class="form-label"><BilingualText key="setup_business_type" /></label>
            <select id="companyClass" name="companyClass" class="form-select" required>
              <option value="1" selected>{$bi('setup_corporation_template')}</option>
              <option value="2">{$bi('setup_sole_proprietor_template')}</option>
            </select>
          </div>

          <div class="mb-3">
            <label for="roundingMethod" class="form-label"><BilingualText key="setup_rounding_tax_label" /></label>
            <select id="roundingMethod" name="roundingMethod" class="form-select" required>
              <option value="1" selected>{$bi('setup_rounding_floor')}</option>
              <option value="2">{$bi('setup_rounding_round')}</option>
              <option value="3">{$bi('setup_rounding_ceil')}</option>
            </select>
          </div>
        </div>

        <div class="d-grid gap-2 mt-4">
          <button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              <BilingualText key="registering" stacked={false} />
            {:else}
              <BilingualText key="setup_complete_button" stacked={false} />
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
