<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <img src="/logo.png" alt="Logo" class="pe-1">Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <div class="d-flex justify-content-end mb-2">
          <LanguagePairSelector save={false} tone="card" />
        </div>
        <p class="fs-4 text-center "><BilingualText key="login" /></p>
        {#if registered && !message}
          <p class="text-success text-center"><BilingualText key="signup_register_success" /></p>
        {/if}
        {#if message}
          <p class="text-{msg_type} text-center">{message}</p>
        {/if}
        <form method="POST" on:submit={onSubmit} use:enhance={handleEnhance}>
          <input type="hidden" name="languagePair" value={pairJson} />
          <div class="mb-3">
            <label for="user_input"><BilingualText key="username" /></label>
            <input
              id="user_input"
              type="text"
              name="username"
              bind:value={user_name}
              class="form-control"
              placeholder={$bi('user_name_placeholder')}
              autocomplete="username"
              disabled={isSubmitting}
            >
          </div>
          <div class="mb-3">
            <label for="password_input"><BilingualText key="password" /></label>
            <input
              id="password_input"
              type="password"
              name="password"
              bind:value={password}
              class="form-control"
              placeholder={$bi('password_placeholder')}
              autocomplete="current-password"
              disabled={isSubmitting}
            >
          </div>
          <div class="row d-flex justify-content-center">
            <div class="col-12 col-lg-8 d-grid">
              <button type="submit" class="btn btn-primary mb-3" disabled={isSubmitting}>
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2"></span>
                {/if}
                <BilingualText key="login" />
              </button>
              <a href={resolve('/signup')} class="text-center"><BilingualText key="signup_link" /></a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
<script>
import { enhance } from '$app/forms';
import { resolve } from '$app/paths';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi, languagePair } from '$lib/i18n/bilingual.js';
import LanguagePairSelector from '../widgets/language-pair-selector.svelte';

export let form = null;
export let registered = false;

let user_name = form?.username || '';
let password = '';
let message = form?.error || '';
let msg_type = form?.error ? 'danger' : '';
let isSubmitting = false;

$: pairJson = JSON.stringify($languagePair || {});
$: if (form?.error) {
  message = form.error;
  msg_type = 'danger';
  user_name = form.username || user_name;
}

const onSubmit = (event) => {
  if (!user_name || !password) {
    event.preventDefault();
    msg_type = 'danger';
    message = $bi('error_login_required');
  }
};

const handleEnhance = () => {
  isSubmitting = true;
  return async ({ result, update }) => {
    if (result.type === 'failure') {
      isSubmitting = false;
      message = result.data?.error || $bi('login_error_occurred');
      msg_type = 'danger';
    }
    await update();
  };
};
</script>
