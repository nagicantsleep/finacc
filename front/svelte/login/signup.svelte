<div class="login-page">
  <div class="login-box signup-box">
    <div class="login-logo">
      <img src="/public/logo.png" alt="Logo" class="pe-1">Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <div class="d-flex justify-content-end mb-2">
          <LanguagePairSelector save={false} />
        </div>
        <p class="fs-4 text-center"><BilingualText key="signup_heading" /></p>
        
        {#if successMessage}
          <div class="alert alert-success text-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            {successMessage}
          </div>
        {:else}
          {#if message}
            <p class="text-{msg_type} text-center">{message}</p>
          {/if}
          
          <fieldset class="mb-3">
            <legend class="fieldset-legend"><BilingualText key="login_info" inline /> <span class="text-danger">*</span></legend>
            
            <div class="mb-3">
              <label for="user_name"><BilingualText key="username" inline /> <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="user_name"
                bind:value={user_name}
                class="form-control"
                class:is-invalid={errors.user_name}
                placeholder={$bi('username_hint')}
                autocomplete="username"
                disabled={isSubmitting}
              >
              <small class="form-text text-muted"><BilingualText key="password_hint" /></small>
              {#if errors.user_name}
                <div class="invalid-feedback">{errors.user_name}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="password"><BilingualText key="password" inline /> <span class="text-danger">*</span></label>
              <input 
                type="password" 
                id="password"
                bind:value={password}
                class="form-control"
                class:is-invalid={errors.password}
                placeholder={$bi('password_placeholder')}
                autocomplete="new-password"
                disabled={isSubmitting}
              >
              <small class="form-text text-muted"><BilingualText key="password_length" /></small>
              {#if errors.password}
                <div class="invalid-feedback">{errors.password}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="confirmPassword"><BilingualText key="password_confirm" inline /> <span class="text-danger">*</span></label>
              <input 
                type="password" 
                id="confirmPassword"
                bind:value={confirmPassword}
                class="form-control"
                class:is-invalid={errors.confirmPassword}
                placeholder={$bi('password_confirm')}
                autocomplete="new-password"
                disabled={isSubmitting}
              >
              {#if errors.confirmPassword}
                <div class="invalid-feedback">{errors.confirmPassword}</div>
              {/if}
            </div>
          </fieldset>
          
          <fieldset class="mb-3">
            <legend class="fieldset-legend"><BilingualText key="basic_info" inline /> <span class="text-danger">*</span></legend>
            
            <div class="mb-3">
              <label for="legalName"><BilingualText key="member_name" inline /> <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="legalName"
                bind:value={legalName}
                class="form-control"
                class:is-invalid={errors.legalName}
                placeholder={$bi('name_placeholder')}
                autocomplete="name"
                disabled={isSubmitting}
              >
              {#if errors.legalName}
                <div class="invalid-feedback">{errors.legalName}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="legalRuby"><BilingualText key="full_name_ruby" /></label>
              <input 
                type="text" 
                id="legalRuby"
                bind:value={legalRuby}
                class="form-control"
                placeholder={$bi('furigana_placeholder')}
                autocomplete="off"
                disabled={isSubmitting}
              >
            </div>
            
            <div class="mb-3">
              <label for="email"><BilingualText key="email" inline /> <span class="text-danger">*</span></label>
              <input 
                type="email" 
                id="email"
                bind:value={email}
                class="form-control"
                class:is-invalid={errors.email}
                placeholder="example@email.com"
                autocomplete="email"
                disabled={isSubmitting}
              >
              {#if errors.email}
                <div class="invalid-feedback">{errors.email}</div>
              {/if}
            </div>
            
            <div class="row mb-3">
              <div class="col-6">
                <label for="birthDate"><BilingualText key="birth_date" /></label>
                <input 
                  type="date" 
                  id="birthDate"
                  bind:value={birthDate}
                  class="form-control"
                  autocomplete="bday"
                  disabled={isSubmitting}
                >
              </div>
              <div class="col-6">
                <label for="legalSex"><BilingualText key="gender" /></label>
                <select 
                  id="legalSex"
                  bind:value={legalSex}
                  class="form-select"
                  autocomplete="sex"
                  disabled={isSubmitting}
                >
                  <option value="">{selectPleaseText}</option>
                  <option value="1">{genderMaleText}</option>
                  <option value="2">{genderFemaleText}</option>
                  <option value="9">{genderOtherText}</option>
                </select>
              </div>
            </div>
            
            <div class="mb-3">
              <label for="telNo"><BilingualText key="tel" /></label>
              <input 
                type="tel" 
                id="telNo"
                bind:value={telNo}
                class="form-control"
                placeholder="090-1234-5678"
                autocomplete="tel"
                disabled={isSubmitting}
              >
            </div>
            
            <div class="mb-3">
              <label for="zip"><BilingualText key="zip_code" /></label>
              <input 
                type="text" 
                id="zip"
                bind:value={zip}
                class="form-control"
                placeholder="123-4567"
                autocomplete="postal-code"
                disabled={isSubmitting}
              >
            </div>
            
            <div class="mb-3">
              <label for="address1"><BilingualText key="address1" /></label>
              <input 
                type="text" 
                id="address1"
                bind:value={address1}
                class="form-control"
                placeholder={$bi('address_placeholder')}
                autocomplete="address-line1"
                disabled={isSubmitting}
              >
            </div>
            
            <div class="mb-3">
              <label for="address2"><BilingualText key="address2" /></label>
              <input 
                type="text" 
                id="address2"
                bind:value={address2}
                class="form-control"
                placeholder={$bi('address2_placeholder')}
                autocomplete="address-line2"
                disabled={isSubmitting}
              >
            </div>
          </fieldset>
          
          <div class="row d-flex justify-content-center">
            <div class="col-lg-8 col-12 d-grid">
              <button 
                type="submit" 
                class="btn btn-primary mb-2"
                on:click={SignUp}
                disabled={isSubmitting}
              >
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2"></span>
                {/if}
                <BilingualText key="register" />
              </button>
              <a on:click|preventDefault={change} href="#" class="text-center"><BilingualText key="login_here" /></a>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
import axios from 'axios';
import {onMount} from 'svelte';
import {get} from 'svelte/store';
import { link } from '../../javascripts/router.js';
import BilingualText from '../components/bilingual-text.svelte';
import { bi, _b } from '../../javascripts/bilingual.js';
import LanguagePairSelector from '../widgets/language-pair-selector.svelte';

// Option text can't host a component; build "primary / secondary" strings reactively.
$: biFn = $bi;
$: selectPleaseText = $bi('select_please');
$: genderMaleText = $bi('gender_male');
$: genderFemaleText = $bi('gender_female');
$: genderOtherText = $bi('gender_other');

// Login credentials
let user_name = '';
let password = '';
let confirmPassword = '';

// Identity
let legalName = '';
let legalRuby = '';
let email = '';

// Optional
let birthDate = '';
let legalSex = '';
let telNo = '';
let zip = '';
let address1 = '';
let address2 = '';

// UI state
let message = '';
let msg_type = '';
let successMessage = '';
let isSubmitting = false;
let errors = {};

onMount(() => {
  resetForm();
});

function resetForm() {
  user_name = '';
  password = '';
  confirmPassword = '';
  legalName = '';
  legalRuby = '';
  email = '';
  birthDate = '';
  legalSex = '';
  telNo = '';
  zip = '';
  address1 = '';
  address2 = '';
  message = '';
  successMessage = '';
  errors = {};
}

function validateForm() {
  errors = {};
  let isValid = true;
  
  if (!user_name || user_name.trim().length === 0) {
    errors.user_name = get(bi)('signup_error_username_required');
    isValid = false;
  } else if (!/^[a-zA-Z0-9_]+$/.test(user_name)) {
    errors.user_name = get(bi)('signup_error_username_invalid');
    isValid = false;
  } else if (user_name.length < 4 || user_name.length > 20) {
    errors.user_name = get(bi)('signup_error_username_length');
    isValid = false;
  }

  if (!password || password.length === 0) {
    errors.password = get(bi)('signup_error_password_required');
    isValid = false;
  } else if (password.length < 8) {
    errors.password = get(bi)('signup_error_password_length');
    isValid = false;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = get(bi)('signup_error_password_mismatch');
    isValid = false;
  }

  if (!legalName || legalName.trim().length === 0) {
    errors.legalName = get(bi)('signup_error_name_required');
    isValid = false;
  }

  if (!email || email.trim().length === 0) {
    errors.email = get(bi)('signup_error_email_required');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = get(bi)('signup_error_email_invalid');
    isValid = false;
  }
  
  return isValid;
}

const change = () => {
  link('/login');
}

const SignUp = async () => {
  message = '';
  successMessage = '';
  
  if (!validateForm()) {
    msg_type = 'danger';
    message = get(bi)('signup_validation_prompt');
    return;
  }
  
  isSubmitting = true;
  
  try {
    const payload = {
      user_name: user_name.trim(),
      password: password,
      legalName: legalName.trim(),
      email: email.trim()
    };
    
    if (legalRuby && legalRuby.trim()) {
      payload.legalRuby = legalRuby.trim();
    }
    if (birthDate) {
      payload.birthDate = birthDate;
    }
    if (legalSex) {
      payload.legalSex = parseInt(legalSex, 10);
    }
    if (telNo && telNo.trim()) {
      payload.telNo = telNo.trim();
    }
    if (zip && zip.trim()) {
      payload.zip = zip.trim();
    }
    if (address1 && address1.trim()) {
      payload.address1 = address1.trim();
    }
    if (address2 && address2.trim()) {
      payload.address2 = address2.trim();
    }
    
    const response = await axios.post('/api/user/signup', payload);
    
    if (response.data.result === 'OK') {
      successMessage = get(bi)('signup_register_success');
      setTimeout(() => {
        link('/login');
      }, 2000);
    } else {
      message = response.data.message || get(bi)('signup_register_fail');
      msg_type = 'danger';
      isSubmitting = false;
    }
  } catch (err) {
    console.error('signup error', err);
    message = err.response?.data?.message || get(bi)('login_error_occurred');
    msg_type = 'danger';
    isSubmitting = false;
  }
}
</script>

<style>
  .signup-box {
    width: 100%;
    max-width: 480px;
  }
  
  @media (min-width: 600px) {
    .signup-box {
      width: 480px;
    }
  }
  
  @media (max-width: 599px) {
    .signup-box {
      width: 95%;
      max-width: none;
    }
  }
  
  .fieldset-legend {
    font-size: 0.95rem;
    font-weight: 600;
    color: #495057;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  
  fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }
  
  .form-text {
    font-size: 0.8rem;
  }
  
  .invalid-feedback {
    display: block;
  }
  
  .alert-success {
    margin-bottom: 1rem;
  }
</style>
