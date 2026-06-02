<div class="menu">
    <div class="body">
        <form>
            <div class="row mb-2">
                <label for="inputCurrentPassword" class="col-sm-5 col-form-label">
                    <BilingualText key="current_password" />
                </label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputCurrentPassword"
                        bind:value={currentPassword}>
                </div>
            </div>
            <div class="row mb-2">
                <label for="inputNewPassword" class="col-sm-5 col-form-label">
                    <BilingualText key="new_password" />
                </label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputNewPassword"
                        bind:value={newPassword}>
                </div>
            </div>
            <div class="row mb-0">
                <label for="inputConfirmPassword" class="col-sm-5 col-form-label">
                    <BilingualText key="confirm_password" />
                </label>
                <div class="col-sm-7">
                    <input type="text" class="form-control" id="inputConfirmPassword"
                        bind:value={confirmPassword}>
                </div>
            </div>
        </form>
    </div>
    <div class="footer">
        <button class="btn btn-primary" on:click|preventDefault={updatePassword}>
            <BilingualText key="update" />
        </button>
    </div>
</div>
<script>
import axios from 'axios';
import BilingualText from '../components/bilingual-text.svelte';
import { _b } from '../../javascripts/bilingual.js';

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
                const pwUpdated = _b('password_updated_msg');
                const pwTitle = _b('password_change');
                toast.show(`${pwTitle.primary} / ${pwTitle.secondary}`, `${pwUpdated.primary} / ${pwUpdated.secondary}`);
                currentPassword = '';
                newPassword = '';
                confirmPassword = '';
            }).catch ((e) => {
                const pwFailed = _b('password_update_failed_msg');
                const pwTitle = _b('password_change');
                toast.show(`${pwTitle.primary} / ${pwTitle.secondary}`, `${pwFailed.primary} / ${pwFailed.secondary}`);
            });
        } else {
            const pwWrong = _b('password_wrong_msg');
            const pwTitle = _b('password_change');
            toast.show(`${pwTitle.primary} / ${pwTitle.secondary}`, `${pwWrong.primary} / ${pwWrong.secondary}`);
        }
    }
}

</script>
