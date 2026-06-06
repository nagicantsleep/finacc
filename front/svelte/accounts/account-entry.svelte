<script>
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import  InputNumber from '../components/input-number.svelte';
import BilingualText from '../components/bilingual-text.svelte';
import {TAX_CLASS} from '../../../libs/utils';

export  let account;
export  let subAccount;
export  let mode;

beforeUpdate(() => {
    console.log({account});
    console.log({subAccount});
})
</script>

<div class="container-fluid">
    <div class="row">
        <div class="col-3">
            <BilingualText key="account_class" />
        </div>
        <div class="col-9">
            <div class="row">
                <div class="col-4"><BilingualText key="major_class" /></div>
                <div class="col-4"><BilingualText key="middle_class" /></div>
                <div class="col-4"><BilingualText key="minor_class" /></div>
            </div>
            <div class="row">
                <div class="col-4">{account.major_name}</div>
                <div class="col-4">{account.middle_name}</div>
                <div class="col-4">{account.minor_name}</div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-3"><BilingualText key="chart_of_accounts" /></div>
        <div class="col-9">
            {#if (subAccount)}
                {account.name}
            {:else}
                <input type="text" id="account_name"
                        bind:value={account.name} size="24">
            {/if}
            {#if ( mode == 'new-account') }
                <input type="text" id="account_code"
                    bind:value={account.code} size="24">
            {:else}
                {account.code}
            {/if}
        </div>
    </div>
    {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
    <div class="row">
        <div class="col-3"><BilingualText key="sub_account" /></div>
        <div class="col-9">
            <input type="text" id="sub_account_name"
                    bind:value={subAccount.name} size="36">
        </div>
    </div>
    {/if}
    <div class="row">
        <div class="col-3"><BilingualText key="search_key" /></div>
        <div class="col-9">
            {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
            <input type="text" id="key" bind:value={subAccount.key} size="24">
            {:else}
            <input type="text" id="key" bind:value={account.key} size="24">
            {/if}
        </div>
    </div>
    <div class="row">
        <div class="col-3"><BilingualText key="tax_classification" /></div>
        <div class="col-9">
            {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
            <select class="form-control" id="tax_class" bind:value={subAccount.taxClass}>
                {#each TAX_CLASS as tax_class}
                <option value={tax_class[1]}>{tax_class[0]}</option>
                {/each}
            </select>
            {:else}
            <select class="form-control" id="tax_class" bind:value={account.taxClass}>
                {#each TAX_CLASS as tax_class}
                <option value={tax_class[1]}>{tax_class[0]}</option>
                {/each}
            </select>
            {/if}
        </div>
    </div>
    <div class="row">
        <div class="col-3"><BilingualText key="debit" /></div>
        <div class="col-9">
            {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
            <InputNumber
                    bind:value={subAccount.debit}></InputNumber>
            {:else}
            <InputNumber
                    bind:value={account.debit}></InputNumber>
            {/if}
        </div>
    </div>
    <div class="row">
        <div class="col-3"><BilingualText key="credit" /></div>
        <div class="col-9">
            {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
            <InputNumber
                    bind:value={subAccount.credit}></InputNumber>
            {:else}
            <InputNumber
                    bind:value={account.credit}></InputNumber>
            {/if}
        </div>
    </div>
    <div class="row">
        <div class="col-3"><BilingualText key="balance" /></div>
        <div class="col-9">
            {#if ( ( mode == 'new-sub-account' ) || ( mode == 'edit-sub-account' ) )}
            <InputNumber
                    bind:value={subAccount.balance}></InputNumber>
            {:else}
            <InputNumber
                    bind:value={account.balance}></InputNumber>
            {/if}
        </div>
    </div>
</div>
