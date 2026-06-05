<div class="modal" bind:this={modalEl} tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><BilingualText key="profile" /></h5>
        <button type="button" class="btn-close" on:click={close}></button>
      </div>
      <div class="modal-body">
        {#if message}
          <div class="alert alert-{msg_type} py-2">{message}</div>
        {/if}
        <div class="mb-3 row">
          <label class="col-sm-4 col-form-label"><BilingualText key="username" /></label>
          <div class="col-sm-8">
            <input type="text" class="form-control-plaintext" readonly value={form.name}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-legalName" class="col-sm-4 col-form-label"><BilingualText key="member_name" /><span class="text-danger">*</span></label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-legalName" bind:value={form.legalName}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-legalRuby" class="col-sm-4 col-form-label"><BilingualText key="reading" /></label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-legalRuby" bind:value={form.legalRuby}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-email" class="col-sm-4 col-form-label"><BilingualText key="mail_label" /><span class="text-danger">*</span></label>
          <div class="col-sm-8">
            <input type="email" class="form-control" id="pf-email" bind:value={form.email}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-telNo" class="col-sm-4 col-form-label"><BilingualText key="phone" /></label>
          <div class="col-sm-8">
            <input type="text" class="form-control" id="pf-telNo" bind:value={form.telNo}>
          </div>
        </div>
        <hr>
        <p class="small text-muted mb-2"><BilingualText key="password_change" /></p>
        <div class="mb-3 row">
          <label for="pf-curpw" class="col-sm-4 col-form-label"><BilingualText key="current_pw" /></label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-curpw" bind:value={currentPassword}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-newpw" class="col-sm-4 col-form-label"><BilingualText key="new_pw" /></label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-newpw" bind:value={newPassword}>
          </div>
        </div>
        <div class="mb-3 row">
          <label for="pf-confpw" class="col-sm-4 col-form-label"><BilingualText key="pw_confirm" /></label>
          <div class="col-sm-8">
            <input type="password" class="form-control" id="pf-confpw" bind:value={confirmPassword}>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={close}><BilingualText key="close" /></button>
        <button type="button" class="btn btn-primary" disabled={saving} on:click={save}>
          {saving ? $bi('modal_saving') : $bi('modal_save')}
        </button>
      </div>
    </div>
  </div>
</div>

<script>
import { onMount, createEventDispatcher } from 'svelte';
import Modal from 'bootstrap/js/dist/modal';
import axios from 'axios';
import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
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
      message = res.data.message || $bi('modal_update_fail');
      msg_type = 'danger';
      saving = false;
      return;
    }
    dispatch('updated', { legalName: form.legalName, email: form.email });

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        message = $bi('modal_pw_mismatch');
        msg_type = 'danger';
        saving = false;
        return;
      }
      const pwRes = await axios.put('/api/user/password', {
        currentPassword,
        newPassword
      });
      if (pwRes.data.result !== 'OK') {
        message = $bi('modal_profile_saved_but_pw_fail');
        msg_type = 'warning';
        saving = false;
        return;
      }
    }

    msg_type = 'success';
    message = $bi('modal_profile_updated');
    saving = false;
  } catch (err) {
    console.error('profile save error', err);
    message = $bi('modal_update_fail');
    msg_type = 'danger';
    saving = false;
  }
};

onMount(() => {
  modal = new Modal(modalEl);
});
</script>
