<div class="login-page">
  <div class="login-box signup-box">
    <div class="login-logo">
      <img src="/public/logo.png" alt="Logo" class="pe-1">Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <p class="fs-4 text-center">サインアップ</p>
        
        {#if successMessage}
          <div class="alert alert-success text-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            {successMessage}
          </div>
        {:else}
          {#if message}
            <p class="text-{msg_type} text-center">{message}</p>
          {/if}
          
          <!-- Section 1: Login Credentials (Required) -->
          <fieldset class="mb-3">
            <legend class="fieldset-legend">ログイン情報 <span class="text-danger">*</span></legend>
            
            <div class="mb-3">
              <label for="user_name">ユーザー名 <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="user_name"
                bind:value={user_name}
                class="form-control"
                class:is-invalid={errors.user_name}
                placeholder="ユーザー名（半角英数字）"
                autocomplete="username"
                disabled={isSubmitting}
              >
              <small class="form-text text-muted">半角英数字、4〜20文字</small>
              {#if errors.user_name}
                <div class="invalid-feedback">{errors.user_name}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="password">パスワード <span class="text-danger">*</span></label>
              <input 
                type="password" 
                id="password"
                bind:value={password}
                class="form-control"
                class:is-invalid={errors.password}
                placeholder="パスワード"
                autocomplete="new-password"
                disabled={isSubmitting}
              >
              <small class="form-text text-muted">8文字以上</small>
              {#if errors.password}
                <div class="invalid-feedback">{errors.password}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="confirmPassword">パスワード（確認） <span class="text-danger">*</span></label>
              <input 
                type="password" 
                id="confirmPassword"
                bind:value={confirmPassword}
                class="form-control"
                class:is-invalid={errors.confirmPassword}
                placeholder="パスワード（確認）"
                autocomplete="new-password"
                disabled={isSubmitting}
              >
              {#if errors.confirmPassword}
                <div class="invalid-feedback">{errors.confirmPassword}</div>
              {/if}
            </div>
          </fieldset>
          
          <!-- Section 2: Basic Identity (Required) -->
          <fieldset class="mb-3">
            <legend class="fieldset-legend">基本情報 <span class="text-danger">*</span></legend>
            
            <div class="mb-3">
              <label for="legalName">氏名 <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="legalName"
                bind:value={legalName}
                class="form-control"
                class:is-invalid={errors.legalName}
                placeholder="山田 太郎"
                autocomplete="name"
                disabled={isSubmitting}
              >
              {#if errors.legalName}
                <div class="invalid-feedback">{errors.legalName}</div>
              {/if}
            </div>
            
            <div class="mb-3">
              <label for="email">メールアドレス <span class="text-danger">*</span></label>
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
          </fieldset>
          
          <!-- Section 3: Optional Details (Collapsible) -->
          <fieldset class="mb-3">
            <legend 
              class="fieldset-legend collapsible-legend"
              on:click={toggleOptionalSection}
              on:keydown={(e) => e.key === 'Enter' && toggleOptionalSection()}
              tabindex="0"
              role="button"
              aria-expanded={showOptional}
              aria-controls="optional-fields"
            >
              追加情報（任意）
              <i class="bi {showOptional ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2"></i>
            </legend>
            
            {#if showOptional}
              <div id="optional-fields" class="optional-fields">
                <div class="mb-3">
                  <label for="legalRuby">氏名（フリガナ）</label>
                  <input 
                    type="text" 
                    id="legalRuby"
                    bind:value={legalRuby}
                    class="form-control"
                    placeholder="ヤマダ タロウ"
                    autocomplete="off"
                    disabled={isSubmitting}
                  >
                </div>
                
                <div class="row mb-3">
                  <div class="col-6">
                    <label for="birthDate">生年月日</label>
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
                    <label for="legalSex">性別</label>
                    <select 
                      id="legalSex"
                      bind:value={legalSex}
                      class="form-select"
                      autocomplete="sex"
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      <option value="1">男性</option>
                      <option value="2">女性</option>
                      <option value="9">その他</option>
                    </select>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="telNo">電話番号</label>
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
                  <label for="zip">郵便番号</label>
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
                  <label for="address1">住所1</label>
                  <input 
                    type="text" 
                    id="address1"
                    bind:value={address1}
                    class="form-control"
                    placeholder="東京都渋谷区..."
                    autocomplete="address-line1"
                    disabled={isSubmitting}
                  >
                </div>
                
                <div class="mb-3">
                  <label for="address2">住所2（建物名等）</label>
                  <input 
                    type="text" 
                    id="address2"
                    bind:value={address2}
                    class="form-control"
                    placeholder="○○ビル 101号室"
                    autocomplete="address-line2"
                    disabled={isSubmitting}
                  >
                </div>
              </div>
            {/if}
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
                登録
              </button>
              <a on:click|preventDefault={change} href="#" class="text-center">ログインはこちら</a>
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
import { link } from '../../javascripts/router.js';

// Required fields - Section 1: Login Credentials
let user_name = '';
let password = '';
let confirmPassword = '';

// Required fields - Section 2: Basic Identity
let legalName = '';
let email = '';

// Optional fields - Section 3
let legalRuby = '';
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
let showOptional = false;
let errors = {};

onMount(() => {
  // Reset all fields on mount
  resetForm();
});

function resetForm() {
  user_name = '';
  password = '';
  confirmPassword = '';
  legalName = '';
  email = '';
  legalRuby = '';
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

function toggleOptionalSection() {
  showOptional = !showOptional;
}

function validateForm() {
  errors = {};
  let isValid = true;
  
  // Username validation
  if (!user_name || user_name.trim().length === 0) {
    errors.user_name = 'ユーザー名を入力してください。';
    isValid = false;
  } else if (!/^[a-zA-Z0-9_]+$/.test(user_name)) {
    errors.user_name = 'ユーザー名は半角英数字とアンダースコアのみ使用できます。';
    isValid = false;
  } else if (user_name.length < 4 || user_name.length > 20) {
    errors.user_name = 'ユーザー名は4〜20文字で入力してください。';
    isValid = false;
  }
  
  // Password validation
  if (!password || password.length === 0) {
    errors.password = 'パスワードを入力してください。';
    isValid = false;
  } else if (password.length < 8) {
    errors.password = 'パスワードは8文字以上で入力してください。';
    isValid = false;
  }
  
  // Confirm password validation
  if (password !== confirmPassword) {
    errors.confirmPassword = 'パスワードが一致していません。';
    isValid = false;
  }
  
  // Legal name validation
  if (!legalName || legalName.trim().length === 0) {
    errors.legalName = '氏名を入力してください。';
    isValid = false;
  }
  
  // Email validation
  if (!email || email.trim().length === 0) {
    errors.email = 'メールアドレスを入力してください。';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '有効なメールアドレスを入力してください。';
    isValid = false;
  }
  
  return isValid;
}

const change = () => {
  link('/login');
}

const SignUp = async () => {
  // Clear previous messages
  message = '';
  successMessage = '';
  
  // Validate form
  if (!validateForm()) {
    msg_type = 'danger';
    message = '入力内容を確認してください。';
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
    
    // Add optional fields only if they have values
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
      // Show success message
      successMessage = '登録が完了しました。ログインページへ移動します...';
      
      // Wait 2 seconds then redirect
      setTimeout(() => {
        link('/login');
      }, 2000);
    } else {
      message = response.data.message || '登録に失敗しました。';
      msg_type = 'danger';
      isSubmitting = false;
    }
  } catch (err) {
    console.error('signup error', err);
    message = err.response?.data?.message || 'エラーが発生しました。';
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
  
  .collapsible-legend {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .collapsible-legend:hover {
    color: #0d6efd;
  }
  
  .collapsible-legend:focus {
    outline: 2px solid #0d6efd;
    outline-offset: 2px;
  }
  
  .optional-fields {
    animation: slideDown 0.2s ease-out;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
