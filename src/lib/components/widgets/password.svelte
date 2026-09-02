<div class="menu menu-form-stacked">
    <div class="body">
        <form>
            <div class="widget-field mb-3">
                <label for="inputCurrentPassword" class="form-label">
                    <BilingualText key="current_password" />
                </label>
                <input type="password" class="form-control" id="inputCurrentPassword"
                    bind:value={currentPassword} autocomplete="current-password">
            </div>
            <div class="widget-field mb-3">
                <label for="inputNewPassword" class="form-label">
                    <BilingualText key="new_password" />
                </label>
                <input type="password" class="form-control" id="inputNewPassword"
                    bind:value={newPassword} autocomplete="new-password">
            </div>
            <div class="widget-field mb-2">
                <label for="inputConfirmPassword" class="form-label">
                    <BilingualText key="confirm_password" />
                </label>
                <input type="password" class="form-control" id="inputConfirmPassword"
                    bind:value={confirmPassword} autocomplete="new-password">
            </div>
        </form>
    </div>
    <div class="footer">
        <button class="btn btn-primary" on:click|preventDefault={updatePassword}>
            <BilingualText key="update" stacked={false} />
        </button>
    </div>
</div>
<script>
import axios from 'axios';
import BilingualText from '$lib/components/BilingualText.svelte';
import { _b } from '$lib/i18n/bilingual.js';

let currentPassword;
let newPassword;
let confirmPassword;

export let toast;

const updatePassword = () => {
    if  ( newPassword ) {
        if  ( newPassword == confirmPassword )    {
            axios.put('/api/user/password', {
                currentPassword: currentPassword,
                newPassword: newPassword
            }).then(() => {
                const pwUpdated = _b('password_updated_msg');
                const pwTitle = _b('password_change');
                toast.show(`${pwTitle.primary} / ${pwTitle.secondary}`, `${pwUpdated.primary} / ${pwUpdated.secondary}`);
                currentPassword = '';
                newPassword = '';
                confirmPassword = '';
            }).catch (() => {
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
