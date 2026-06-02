<div class="list">
  <div class="page-title d-flex justify-content-between">
    <h1><BilingualText key="member_list" /></h1>
    <button type="button" class="btn btn-primary"
      on:click={() => {
        openMember(null);
      }}
      id="member-info"><BilingualText key="member_entry_space" /><i class="bi bi-pencil-square"></i></button>
  </div> 
  <div class="full-height-1 fontsize-12pt">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 120px;"><BilingualText key="class_name" /></th>
          <th scope="col" style="width: 200px;"><BilingualText key="name" /></th>
          <th scope="col" style="width: 70px;"><BilingualText key="status" /></th>
          <th scope="col" class="th-perm"><BilingualText key="link" /></th>
          <th scope="col" class="th-perm"><BilingualText key="administrator" /></th>
          <th scope="col" class="th-perm"><BilingualText key="accounting" /></th>
          <th scope="col" class="th-perm"><BilingualText key="accounting" /><br><BilingualText key="view_only" /></th>
          <th scope="col" class="th-perm"><BilingualText key="approve" /><br><BilingualText key="possible" /></th>
          <th scope="col" class="th-perm"><BilingualText key="customer" /><br><BilingualText key="administration" /></th>
          <th scope="col" class="th-perm"><BilingualText key="inventory" /><br><BilingualText key="administration" /></th>
          <th scope="col" class="th-perm"><BilingualText key="personnel" /><br><BilingualText key="administration" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="hire_date" /></th>
        </tr>
        <tr>
          <th style="padding:5px;">
            <select class="form-select form-select-sm" id="memberClass"
              on:input={handleFilterChange}
              bind:value={memberClassId}>
              <option value={-1}><BilingualText key="all" /></option>
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
              {line.status === 'active' ? $bi('active') : $bi('retired')}
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
  .th-perm {
    width: 46px;
    text-align: center;
    font-size: 11px;
    line-height: 1.3;
    vertical-align: bottom;
    white-space: normal;
  }
</style>

<script>
import {onMount, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import {parseParams} from '../../javascripts/params.js';
import { link } from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
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
