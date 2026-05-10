<div class="modal" bind:this={modalEl} tabindex="-1" data-bs-backdrop="static">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">プロフィール</h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>
      <div class="modal-body">
        {#if message}
          <div class="alert alert-{msg_type} py-2">{message}</div>
        {/if}
        <div class="mb-3 row">
          <label class="col-sm-4 col-form-label">ユーザー名</label>
          <div class="col-sm-8">
            <input type="text" class="form-control-plaintext" readonly value={form.name}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-legalName" class="col-sm-4 col-form-label">氏名 <span class="text-danger">*</span></label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-legalName" bind:value={form.legalName}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-legalRuby" class="col-sm-4 col-form-label">読み</label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-legalRuby" bind:value={form.legalRuby}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-email" class="col-sm-4 col-form-label">メール <span class="text-danger">*</span></label>
          <div class="col-sm-8">
            <input type="email" class="form-control" id="pf-email" bind:value={form.email}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-telNo" class="col-sm-4 col-form-label">電話</label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-telNo" bind:value={form.telNo}>
          </div>
        </div>
        <hr>
        <p class="small text-muted mb-2">パスワード変更</p>
        <div class="mb-3 row">
          <label for="pf-curpw" class="col-sm-4 col-form-label">現在のPW</label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-curpw" bind:value={currentPassword}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-newpw" class="col-sm-4 col-form-label">新しいPW</label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-newpw" bind:value={newPassword}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-confpw" class="col-sm-4 col-form-label">PW確認</label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-confpw" bind:value={confirmPassword}>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={close}>閉じる</button>
        <button type="button" class="btn btn-primary" disabled={saving} on:click={save}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  </div>
</div>

<script>
import { onMount, createEventDispatcher } from 'svelte';
import Modal from 'bootstrap/js/dist/modal';
import axios from 'axios';

const dispatch = createEventDispatcher();

export let user = {};

let modalEl;
let modal;
let saving = false;
let message = '';
let msg_type = 'danger';

let form = { name: '', legalName: '', legalRuby: '', email: '', telNo: '' };
let currentPassword = '';
let newPassword = '';
let confirmPassword = '';

export const show = () => {
  form = {
    name: user.name || '',
    legalName: user.legalName || '',
    legalRuby: user.legalRuby || '',
    email: user.email || '',
    telNo: user.telNo || ''
  };
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  modal?.show();
};

const close = () => modal?.hide();

const save = async () => {
  message = '';
  saving = true;

  try {
    const res = await axios.put('/api/user/profile', {
      legalName: form.legalName,
      legalRuby: form.legalRuby,
      email: form.email,
      telNo: form.telNo
    });
    if (res.data.result !== 'OK') {
      message = res.data.message || '更新に失敗しました。';
      msg_type = 'danger';
      saving = false;
      return;
    }
    dispatch('updated', { legalName: form.legalName, email: form.email });

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        message = 'パスワードが一致しません。';
        msg_type = 'danger';
        saving = false;
        return;
      }
      const pwRes = await axios.put('/api/user/password', {
        currentPassword,
        newPassword
      });
      if (pwRes.data.result !== 'OK') {
        message = 'プロフィールは保存しましたが、パスワードの更新に失敗しました。';
        msg_type = 'warning';
        saving = false;
        return;
      }
    }

    msg_type = 'success';
    message = 'プロフィールを更新しました。';
    saving = false;
  } catch (err) {
    console.error('profile save error', err);
    message = '更新に失敗しました。';
    msg_type = 'danger';
    saving = false;
  }
};

onMount(() => {
  modal = new Modal(modalEl);
});
</script>
