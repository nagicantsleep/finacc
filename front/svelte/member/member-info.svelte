<input type="hidden" id="id" value={member.id}>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container-fluid">
  <div class="row mb-3">
    <label for="memberClass" class="col-1 col-form-label">種別</label>
    <div class="col-2">
      <select class="form-select" id="memberClass" bind:value={member.memberClassId}>
        <option value="-1">未設定</option>
        {#if classes}
        {#each classes as line}
        <option value={line.id}>{line.title}</option>
        {/each}
        {/if}
      </select>
    </div>
    <label for="user" class="col-1 col-form-label">ユーザー</label>
    <div class="col-3">
      <select class="form-select" id="user" bind:value={member.userId} disabled={!member.id}>
        {#if users}
        <option value={0}>未設定</option>
        {#each users as line}
        <option value={line.id}>{line.name}</option>
        {/each}
        {/if}
      </select>
      {#if !member.id}
      <div class="form-text text-muted">保存後に連携可能</div>
      {/if}
    </div>
    <label for="status" class="col-1 col-form-label">状態</label>
    <div class="col-2">
      <select class="form-select" id="status" bind:value={member.status}>
        <option value="active">在職</option>
        <option value="inactive">退職</option>
      </select>
    </div>
  </div>
  <div class="row mb-3">
    <label for="tradingName" class="col-1 col-form-label">表示名</label>
    <div class="col-5">
      <input type="text" class="form-control" id="tradingName"
        bind:value={member.tradingName}>
      <div class="form-text text-muted">テナント内での表示名。未設定の場合はユーザー名を使用。</div>
    </div>
  </div>
  <div class="row mb-3">
    <label for="joiningDate" class="col-1 col-form-label">入社日</label>
    <div class="col-2">
      <input type="date" class="form-control" id="joiningDate"
        bind:value={member.joiningDate}>
    </div>
    <label for="resignedDate" class="col-1 col-form-label">退職日</label>
    <div class="col-2">
      <input type="date" class="form-control" id="resignedDate"
        bind:value={member.resignedDate}>
    </div>
    <label for="resignReason" class="col-1 col-form-label">退職事由</label>
    <div class="col-2">
      <select class="form-select" id="resignReason" bind:value={member.resignReason}>
        {#each RESIGN_REASON as reason}
        <option value={reason[0]}>{reason[1]}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="row mb-3">
    <label for="dependent" class="col-1 col-form-label">扶養家族</label>
    <div class="col-1">
      <input type="text" class="form-control number" id="dependent"
        bind:value={member.dependent}>
    </div>
    <label class="col-1 col-form-label">人</label>
    <label for="socialInsuranceNumber" class="col-1 col-form-label">社会保険番号</label>
    <div class="col-3">
      <input type="text" class="form-control" id="socialInsuranceNumber"
        bind:value={member.socialInsuranceNumber}>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-1">口座情報</div>
    <div class="col-11">
      <div class="row">
        <label for="bankName" class="col-3 col-form-label">金融機関名</label>
        <label for="bankBranchName" class="col-3 col-form-label">支店名</label>
        <label for="accountType" class="col-2 col-form-label">口座種別</label>
        <label for="accountNo" class="col-3 col-form-label">口座番号</label>
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
    <label for="operation" class="col-1 col-form-label">備考</label>
    <div class="col-11">
      <textarea class="form-control" id="operation" rows="2"
        bind:value={member.operation}></textarea>
    </div>
  </div>
  {#if ( member.userId && member.userId > 0 && member.user )}
  <hr>
  <div class="row mb-3">
    <div class="col-12">
      <h6>権限設定</h6>
      <p class="text-muted small">リンク済みユーザー「{member.user.name}」の権限を設定します。</p>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.administrable}>
        管理者
      </label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.accounting}>
        会計
      </label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.fiscalBrowsing}>
        会計(閲覧)
      </label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.approvable}>
        承認可能
      </label>
    </div>
  </div>
  <div class="row mb-3">
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.companyManagement}>
        顧客管理
      </label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.inventoryManagement}>
        在庫管理
      </label>
    </div>
    <div class="col-3">
      <label class="form-check-label">
        <input type="checkbox" class="form-check-input" bind:checked={member.personnelManagement}>
        人事管理
      </label>
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

export	let	member;
export  let classes;
export  let users;
beforeUpdate(() => {
})
onMount(() => {
  console.log('member-info onMount', member);
})
</script>
