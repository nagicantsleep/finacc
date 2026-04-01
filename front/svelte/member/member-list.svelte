<div class="list">
  <div class="page-title d-flex justify-content-between">
    <h1>役職員一覧</h1>
    <button type="button" class="btn btn-primary"
      on:click={() => {
        openMember(null);
      }}
      id="member-info">役職員入力&nbsp;<i class="bi bi-pencil-square"></i></button>
  </div> 
  <div class="full-height-1 fontsize-12pt">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 120px;">クラス</th>
          <th scope="col" style="width: 200px;">名前</th>
          <th scope="col" style="width: 70px;">状態</th>
          <th scope="col" style="width: 40px;" title="ユーザー連携">連携</th>
          <th scope="col" style="width: 40px;" title="管理者">管</th>
          <th scope="col" style="width: 40px;" title="会計">会</th>
          <th scope="col" style="width: 40px;" title="会計(閲覧)">閲</th>
          <th scope="col" style="width: 40px;" title="承認可能">承</th>
          <th scope="col" style="width: 40px;" title="顧客管理">顧</th>
          <th scope="col" style="width: 40px;" title="在庫管理">在</th>
          <th scope="col" style="width: 40px;" title="人事管理">人</th>
          <th scope="col" style="width: 100px;">入社日</th>
        </tr>
        <tr>
          <th style="padding:5px;">
            <select class="form-select form-select-sm" id="memberClass"
              on:input={handleFilterChange}
              bind:value={memberClassId}>
              <option value={-1}>全て</option>
              {#each classes as line}
              <option value={line.id}>{line.title}</option>
              {/each}
            </select>
          </th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each members as line}
        <tr>
          <td>{line.memberClass ? line.memberClass.title : ''}</td>
          <td>
            <button type="button" class="btn btn-link p-0"
              on:click={() => { openMember(line.id); }}>
              {line.tradingName ? line.tradingName : line.legalName}
            </button>
          </td>
          <td>
            <span class="badge {line.status === 'active' ? 'bg-success' : 'bg-secondary'}">
              {line.status === 'active' ? '在職' : '退職'}
            </span>
          </td>
          <td class="text-center">{#if line.userId}●{/if}</td>
          <td class="text-center">{#if line.administrable}✓{/if}</td>
          <td class="text-center">{#if line.accounting}✓{/if}</td>
          <td class="text-center">{#if line.fiscalBrowsing}✓{/if}</td>
          <td class="text-center">{#if line.approvable}✓{/if}</td>
          <td class="text-center">{#if line.companyManagement}✓{/if}</td>
          <td class="text-center">{#if line.inventoryManagement}✓{/if}</td>
          <td class="text-center">{#if line.personnelManagement}✓{/if}</td>
          <td>{#if line.joiningDate}{line.joiningDate.replaceAll('-', '/')}{/if}</td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
</style>

<script>
import {onMount, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import {parseParams} from '../../javascripts/params.js';
import { link } from '../../javascripts/router.js';

export let status;
export	let	members;
export  let classes;

let memberClassId;

const handleFilterChange = (event) => {
  const newParams = new URLSearchParams(window.location.search);
  const value = event.currentTarget.value;
  if (value === '-1') {
    newParams.delete('memberClassId');
  } else {
    newParams.set('memberClassId', value);
  }
  link(`/member/list?${newParams.toString()}`);
};

onMount(() => {
  status.params = parseParams();
  memberClassId = status.params.memberClassId || -1;
});

const openMember = (id) => {
  let	member;
  if  ( id ) {
    for ( let i = 0; i < members.length; i ++ ) {
      if ( members[i].id == id ) {
        member = members[i];
        break;
      }
    }
  }
  dispatch('open', member);
}
</script>
