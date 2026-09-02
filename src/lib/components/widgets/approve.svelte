{#if ( count > 0 )}
<div class="menu">
	<div class="body">
    <div class="row">
    	<ul class="list-group">
        <li class="list-group-item">
          <BilingualText key="count_label" stacked={false} />: {count}
        </li>
      </ul>
    </div>
	  <div class="table-responsive">
		  <table class="table table-bordered table-sm mb-0">
        <thead class="table-light">
          <tr>
          <th colspan="2">
            <BilingualText key="voucher_info" stacked={false} />
          </th>
          <th style="min-width: 6rem;">
            <BilingualText key="username" stacked={false} />
          </th>
          <th style="min-width: 6rem;"><BilingualText key="updated_by" stacked={false} /></th>
          <th><BilingualText key="application" stacked={false} /></th>
          </tr>
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
              {slip.lines[0]?.application1}/{slip.lines[0]?.application2 || ''}
            </td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
{:else}
<div class="menu">
  <div class="widget-empty">
    <BilingualText key="approve_pending_count" stacked={false} />: 0
  </div>
</div>
{/if}
{#if popUp}
{#key modalCount}
<CrossSlipModal
	slip={slip}
	status={status}
	user={status?.user}
	accounts={accounts}
	bind:popUp={popUp}
	on:close={close_}></CrossSlipModal>
{/key}
{/if}

<style>
th {
  text-align: center;
  font-weight: bold;
}
td {
    vertical-align: middle;
}
</style>
<script>
import axios from 'axios';
import {onMount, afterUpdate, tick, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import CrossSlipModal from '../cross-slip/cross-slip-modal.svelte';
import {setAccounts} from '$lib/client/cross-slip.js';
import { v4 as uuidv4 } from "uuid";
import BilingualText from '$lib/components/BilingualText.svelte';

export let status = {};
export let toast;
export let options = {};

let count = 0;
let slips = [];
let slip = {
  lines:[]
};
let accounts;
let modal;
const newId = uuidv4();
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

const close_ = (event) => {
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
  if (options.pendingSlips) {
    hydrateSlips(options.pendingSlips);
  } else {
    getSlips();
  }
  if (options.accounts) {
    hydrateAccounts(options.accounts);
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
