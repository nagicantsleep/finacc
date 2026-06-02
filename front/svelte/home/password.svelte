<div class="card">
  <div class="card-header">
    <h5 class="card-title"><BilingualText key="password_change" /></h5>
  </div>
    <div class="card-body">
        <form>
            <div class="row mb-3">
                <label for="inputCurrentPassword" class="col-sm-5 col-form-label"><BilingualText key="current_password" /></label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputCurrentPassword"
                        bind:value={currentPassword}>
                </div>
            </div>
            <div class="row mb-3">
                <label for="inputNewPassword" class="col-sm-5 col-form-label"><BilingualText key="new_password" /></label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputNewPassword"
                        bind:value={newPassword}>
                </div>
            </div>
            <div class="row mb-3">
                <label for="inputConfirmPassword" class="col-sm-5 col-form-label"><BilingualText key="reenter_new_password" /></label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputConfirmPassword"
                        bind:value={confirmPassword}>
                </div>
            </div>
            <button class="btn btn-primary" on:click|preventDefault={updatePassword}><BilingualText key="update_password" /></button>
        </form>
    </div>
</div>
<script>
import axios from 'axios';

import BilingualText from '../components/bilingual-text.svelte';
let currentPassword;
let newPassword;
let confirmPassword;

export let toast;

const updatePassword = (event) => {
    if  ( newPassword ) {
        if  ( newPassword == confirmPassword )    {
            axios.put('/api/user/password', {
                currentPassword: currentPassword,
                newPassword: newPassword
            }).then((res) => {
                toast.show($bi('password'), $bi('password_updated_msg'));
                currentPassword = '';
                newPassword = '';
                confirmPassword = '';
            }).catch ((e) => {
                toast.show($bi('password'), $bi('password_update_failed_msg'));
            });
        } else {
            toast.show($bi('password'), $bi('password_wrong_msg'));
        }
    }
}

</script>