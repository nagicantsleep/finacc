<input type="hidden" id="id" value={member.id}>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container-fluid">
  <div class="row mb-3">
    <label for="memberClass" class="col-1 col-form-label"><BilingualText key="kind" /></label>
    <div class="col-2">
      <select class="form-select" id="memberClass" bind:value={member.memberClassId}>
        <option value="-1"><BilingualText key="not_set" /></option>
        {#if classes}
        {#each classes as line}
        <option value={line.id}>{line.title}</option>
        {/each}
        {/if}
      </select>
    </div>
    <label for="user" class="col-1 col-form-label"><BilingualText key="user_label" /></label>
    <div class="col-3">
      <select class="form-select" id="user" bind:value={member.userId} disabled={!member.id}>
        {#if users}
        <option value={0}><BilingualText key="not_set" /></option>
        {#each users as line}
        <option value={line.id}>{line.name}</option>
        {/each}
        {/if}
      </select>
      {#if !member.id}
      <div class="form-text text-muted"><BilingualText key="linkable_after_save" /></div>
      {/if}
    </div>
    <label for="status" class="col-1 col-form-label"><BilingualText key="status" /></label>
    <div class="col-2">
      <select class="form-select" id="status" bind:value={member.status}>
        <option value="active"><BilingualText key="active" /></option>
        <option value="inactive"><BilingualText key="retired" /></option>
      </select>
    </div>
  </div>
  <div class="row mb-3">
    <label for="tradingName" class="col-1 col-form-label"><BilingualText key="display_name" /></label>
    <div class="col-5">
      <input type="text" class="form-control" id="tradingName"
        bind:value={member.tradingName}>
      <div class="form-text text-muted"><BilingualText key="display_name_hint" /></div>
    </div>
  </div>
  <div class="row mb-3">
    <label for="joiningDate" class="col-1 col-form-label"><BilingualText key="hire_date" /></label>
    <div class="col-2">
      <input type="date" class="form-control" id="joiningDate"
        bind:value={member.joiningDate}>
    </div>
    <label for="resignedDate" class="col-1 col-form-label"><BilingualText key="retirement_date" /></label>
    <div class="col-2">
      <input type="date" class="form-control" id="resignedDate"
        bind:value={member.resignedDate}>
    </div>
    <label for="resignReason" class="col-1 col-form-label"><BilingualText key="retirement_reason" /></label>
    <div class="col-2">
      <select class="form-select" id="resignReason" bind:value={member.resignReason}>
        {#each RESIGN_REASON as reason}
        <option value={reason[0]}>{reason[1]}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="row mb-3">
    <label for="dependent" class="col-1 col-form-label"><BilingualText key="dependents" /></label>
    <div class="col-1">
      <input type="text" class="form-control number" id="dependent"
        bind:value={member.dependent}>
    </div>
    <label class="col-1 col-form-label"><BilingualText key="persons" /></label>
    <label for="socialInsuranceNumber" class="col-1 col-form-label"><BilingualText key="social_insurance" /></label>
    <div class="col-3">
      <input type="text" class="form-control" id="socialInsuranceNumber"
        bind:value={member.socialInsuranceNumber}>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-1"><BilingualText key="account_info" /></div>
    <div class="col-11">
      <div class="row">
        <label for="bankName" class="col-3 col-form-label"><BilingualText key="financial_institution" /></label>
        <label for="bankBranchName" class="col-3 col-form-label"><BilingualText key="bank_branch" /></label>
        <label for="accountType" class="col-2 col-form-label"><BilingualText key="account_type" /></label>
        <label for="accountNo" class="col-3 col-form-label"><BilingualText key="account_number" /></label>
      </div>
      <div class="row">
        <div class="col-3">
          <input type="text" class="form-control" id="bankName" bind:value={member.bankName}>
        </div>
        <div class="col-3">
          <input type="text" class="form-control" id="bankBranchName" bind:value={member.bankBranchName}>
        </div>
        <div class="col-2">
          <select class="form-control" id="accountType" bind:value={member.accountType}>
            {#each BANK_ACCOUNT_TYPE as bank}
            <option value={bank[0]}>{bank[1]}</option>
            {/each}
          </select>
        </div>
        <div class="col-3">
          <input type="text" class="form-control" id="accountNo" bind:value={member.accountNo}>
        </div>
      </div>
    </div>
  </div>
  <div class="row mb-3">
    <label for="operation" class="col-1 col-form-label"><BilingualText key="remarks" /></label>
    <div class="col-11">
      <textarea class="form-control" id="operation" rows="2"
        bind:value={member.operation}></textarea>
    </div>
  </div>
  {#if ( member.userId && member.userId > 0 && member.user )}
  <hr>
  <div class="row mb-3">
    <div class="col-12">
      <h6><BilingualText key="permission_settings" /></h6>
      <p class="text-muted small">{$bi('member_permission_hint', { userName: member.user.name })}</p>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.administrable}><BilingualText key="administrator" /></label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.accounting}><BilingualText key="accounting" /></label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.fiscalBrowsing}><BilingualText key="accounting_view" /></label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.approvable}><BilingualText key="approvable" /></label>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.companyManagement}><BilingualText key="customer_management" /></label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.inventoryManagement}><BilingualText key="inventory_management" /></label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.personnelManagement}><BilingualText key="personnel_management" /></label>
    </div>
  </div>
  {/if}
</div>
<style>
</style>

<script>
import {onMount, beforeUpdate, createEventDispatcher} from 'svelte';
import {RESIGN_REASON} from '../../../libs/member';
import {BANK_ACCOUNT_TYPE} from '../../../libs/utils';

import BilingualText from '../components/bilingual-text.svelte';
export	let	member;
export  let classes;
export  let users;
beforeUpdate(() => {
})
onMount(() => {
  console.log('member-info onMount', member);
})
</script>
