<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <img src="/public/logo.png" alt="Logo" class="pe-1">Hieronyms
    </div>
    <div class="card">
      <div class="card-body login-card-body">
        <p class="fs-4 text-center ">ログイン</p>
        <p class="text-{msg_type} text-center">{message}</p>
        <div class="mb-3">
          <label for="user_input">ユーザー名</label>
          <input type="text" bind:value={user_name} class="form-control" placeholder="ユーザー名">
        </div>
        <div class="mb-3">
          <label for="password_input">パスワード</label>
          <input type="password" bind:value={password} class="form-control" placeholder="パスワード">
        </div>
        <div class="row d-flex justify-content-center">
          <div class="col-lg-8 col-4 d-grid">
            <button type="button" class="btn btn-primary mb-3"
              on:click={Login}
              disabled={isSubmitting}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2"></span>
              {/if}
              ログイン
            </button>
            <a on:click|preventDefault={change} href="#" class="text-center">アカウント登録はこちら</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import axios from 'axios';
export let current;

let user_name = '';
let password = '';
let message = '';
let msg_type = '';
let isSubmitting = false;

const change = (event) => {
  current = 'signup';
  window.history.pushState(null, "", `/signup`);
}

onMount(() => {
  user_name = '';
  password = '';
  message = '';
})

const Login = async () => {
  if (!user_name || !password) {
    msg_type = 'danger';
    message = 'ユーザー名またはパスワードが入力されていません。';
    return;
  }
  
  isSubmitting = true;
  
  try {
    const response = await axios.post('/api/user/login', {
      user_name,
      password
    });
    
    console.log('result', response.data);
    
    if (response.data.result === 'OK') {
      // Check if tenant selection is needed
      if (response.data.requiresTenantSelection) {
        current = 'tenant-select';
        window.history.pushState(null, "", `/login/select-tenant`);
      } else {
        // Direct login successful
        window.location = '/home';
      }
    } else {
      msg_type = 'danger';
      message = response.data.message || 'ユーザー名またはパスワードが違います。';
      isSubmitting = false;
    }
  } catch (err) {
    console.error('login error', err);
    message = 'エラーが発生しました。';
    msg_type = 'danger';
    isSubmitting = false;
  }
}

</script>