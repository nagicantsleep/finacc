{#if ( status.user.approvable )}
{#if ( count > 0 ) }
<div class="card">
  <div class="card-header">
    <h3 class="card-title"><BilingualText key="approval_pending" /></h3>
  </div>
  <div class="card-body">
    <div class="row">
    	<ul class="list-group">
        <li class="list-group-item">
          {$bi('approve_pending_count')}: {count}
        </li>
      </ul>
    </div>
	  <div class="row full-height table-responsive" style="overflow-y: scroll;">
		  <table class="table table-bordered">
        <thead class="table-light">
          <th colspan="2"><BilingualText key="date_voucher_no" /></th>
          <th style="width: 100px;"><BilingualText key="created_by" /></th>
          <th style="width: 100px;"><BilingualText key="updated_by" /></th>
          <th><BilingualText key="application" /></th>
        </thead>
        <tbody>
          {#each slips as slip}
          <tr>
            <td style="width:50px;text-align:center;">
              {slip.month}/{slip.day}
            </td>
            <td style="width:50px;" class='number'>
              <button type="button" class="btn btn-link"
                on:click|preventDefault={() => {
                  openSlip(slip.year, slip.month, slip.no);
                }}>
                {slip.no}
              </button>
            </td>
            <td class="">
              {slip.creater ? slip.creater.name: ''}
            </td>
            <td class="">
              {slip.updater ? slip.updater.name: ''}
            </td>
            <td>
              {#if slip.lines[0]?.application1 }
              {#if slip.lines[0]?.application2 }
              {slip.lines[0]?.application1}/{slip.lines[0]?.application2}
              {:else}
              {slip.lines[0]?.application1}
              {/if}
              {:else}
              {#if slip.lines[0]?.application2 }
              {slip.lines[0]?.application2}
              {/if}
              {/if}
            </td>
          </tr>
          {/each}
        </tbody>              
      </table>
    </div>
  </div>
</div>
{/if}
{#if popUp}
{#key modalCount}
<CrossSlipModal
	slip={slip}
	status={status}
	user={status.user}
	accounts={accounts}
	bind:popUp={popUp}
	on:close={close_}></CrossSlipModal>
{/key}
{/if}
{/if}
<script>
import axios from 'axios';
import {onMount, afterUpdate} from 'svelte';
import CrossSlipModal from '../cross-slip/cross-slip-modal.svelte';
import {setAccounts} from '$lib/client/cross-slip.js';

import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';
export let status;
export let toast;
export let pendingSlips = null;
export let accounts = null;

let count = 0;
let slips = [];
let slip = {
  lines:[]
};
let modalCount = 0;
let popUp;
let hydrated = false;

const hydrateSlips = (value) => {
  if (!value) return;
  slips = value;
  count = slips.length;
  hydrated = true;
};

const hydrateAccounts = (value) => {
  if (!value) return;
  accounts = value;
  setAccounts(accounts);
};

const setupAccount = () => {
	accounts = [];
	axios.get(`/api/accounts`).then((res) => {
		accounts = res.data;
		setAccounts(accounts);
	});
}

const close_ = () => {
	getSlips();
}

const openSlip = (year, month, no) => {
  axios.get(`/api/cross-slip/${year}/${month}/${no}`).then((result) => {
    slip = result.data;
    popUp = true;
  })
}

const getSlips = () => {
  axios.get('/api/cross-slip/not-approved').then((result) => {
    slips = result.data;
    count = slips.length;
  })
}

onMount(() => {
  if (pendingSlips) {
    hydrateSlips(pendingSlips);
  } else {
    getSlips();
  }
  if (accounts) {
    hydrateAccounts(accounts);
  } else if (!accounts) {
    setupAccount();
  }
})
afterUpdate(() => {
  if  (!popUp)  {
    modalCount += 1;
  }
})

</script>
