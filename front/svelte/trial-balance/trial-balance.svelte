{#key $currentPage}
<div class="list">
  <div class="page-title d-flex justify-content-between">
  	<h1 class="page-title-bilingual"><BilingualText key="trial_balance" inline={true} /></h1>
  	<a href="/forms/trial_balance/{status.fy.term}?format=pdf"
      download="{$bi('trial_balance')}.pdf" class="btn btn-primary btn-bilingual"><BilingualText key="download_trial_balance" inline={true} /><i class="bi bi-download"></i>
  	</a>
	</div>
	<ul class="page-subtitle nav me-auto">
  	<li class="nav-item">
    	{#if ( !status.month  )}
    	<button type="button" class="btn btn-primary month-btn disabled me-2"
      	on:click={() => {
          openMonth("");
        }}><BilingualText key="fiscal_year" stacked={true} /></button>
    	{:else}
    	<button type="button" class="btn btn-outline-primary month-btn me-2"
      	on:click={() => {
        	openMonth("");
      	}}><BilingualText key="fiscal_year" stacked={true} /></button>
    	{/if}
  	</li>
  	{#each dates as date}
  	<li class="nav-item">
    	{#if (date.ym == status.month)}
    	<button type="button" class="btn btn-primary month-btn disabled me-2"
      	on:click={() => {
          openMonth(`${date.year}-${date.month}`);
        }}>
  	    <BilingualText key={`month_${date.month}`} stacked={true} />
    	</button>
	    {:else}
  	  <button type="button" class="btn btn-outline-primary month-btn me-2"
      on:click={() => {
        openMonth(`${date.year}-${date.month}`);
      }}>
      <BilingualText key={`month_${date.month}`} stacked={true} />
  	  </button>
    	{/if}
	  </li>
  	{/each}
	</ul>
	<div class="row body-height">
  	<TrialBalanceList
    	bind:status={status}
	    lines={lines}>
  	</TrialBalanceList>
	</div>
</div>
{/key}

<style>
.page-title {
  margin-bottom: 1rem;
}
.month-btn {
  min-height: 56px;
  line-height: 1.2;
  white-space: normal;
  padding: 0.25rem 0.5rem;
}
.btn-bilingual {
  min-height: 56px;
  line-height: 1.2;
  white-space: normal;
  padding: 0.25rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.page-title-bilingual {
  display: inline-flex;
  align-items: center;
  line-height: 1.3;
}
</style>

<script>
import axios from 'axios';
import {onMount} from 'svelte';
import TrialBalanceList from './trial-balance-list.svelte';
import {numeric} from '../../../libs/utils.js';
import {currentPage, link} from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
import { bi, languagePair } from '../../javascripts/bilingual.js';
export let status;
export let alert;
export let alert_level;

let lines = [];
let dates = [];
let lastCheckedPage = null;

// $currentPage (URL) が変更された時だけ実行する
$: if ($currentPage && $currentPage !== lastCheckedPage) {
  checkPage($currentPage);
  lastCheckedPage = $currentPage;
}

// status.fy が準備できたら、月のリストを更新する
$: if (status && status.fy && status.fy.term) {
  updateDates();
}

const openMonth = (month) => {
  let href;
  if (month) {
    href = `/trial-balance/${month}`;
  } else {
    href = `/trial-balance`;
  }
  link(href);
}

const lpQuery = () => {
  const pair = $languagePair;
  return `?languagePair=${encodeURIComponent(JSON.stringify(pair))}`;
}

const updateLines = async () => {
  // status.fy.term が未設定の場合はAPIを呼ばない
  if (!status || !status.fy || !status.fy.term) {
    return;
  }

  let _lines = [];
  let url;
  if  ( status.month ) {
    url = `/api/trial-balance/${status.month}${lpQuery()}`;
  } else {
    url = `/api/trial-balance${lpQuery()}`;
  }
  const result = await axios.get(url);
  let data = result.data;
  let trial_balance = data;
  let last_account = {};
  for ( let i = 0; i < trial_balance.length; i ++ ) {
    let account = trial_balance[i];
    if	( !account.code ) continue;
    if	( account.code.length > 7 ) continue;
    let new_line = {
      name: account.name,
      nameVi: account.nameVi || '',
      pickup: numeric(account.pickup),
      debit: numeric(account.debit),
      credit: numeric(account.credit),
      balance: numeric(account.balance),
      code: account.code
    };
    if ( last_account.middle_name != account.middle_name ) {
      _lines.push({
        name: `【${account.middle_name}】`,
        middle_name: account.middle_name,
        middle_nameVi: account.middle_nameVi || ''
      });
    }
    if ( last_account.minor_name != account.minor_name ) {
      _lines.push({
        name: account.minor_name,
        minor_name: account.minor_name,
        minor_nameVi: account.minor_nameVi || ''
      });
    }
    if	(( new_line.pickup != 0 ) ||
       ( new_line.debit  != 0 ) ||
       ( new_line.credit != 0 ) ||
       ( new_line.balance != 0 )) {
      _lines.push(new_line);
    }
    last_account = account;	 
  }
  lines = _lines;
}

const updateDates = () => {
  let _dates = [];
  let mon = new Date(status.fy.startDate);
  for ( let i = 0 ; i < 12 ; i += 1)  {
    _dates.push({
      year: mon.getFullYear(),
      month: mon.getMonth()+1,
      ym: `${mon.getFullYear()}-${mon.getMonth()+1}`
    });
    mon.setMonth(mon.getMonth() + 1);
  }
  dates = _dates;
}

const checkPage = (page) => {
  if (!page || page.split('/')[1] !== 'trial-balance') {
    return;
  }
  const path = page;
  const args = path.split('/');
  status.month = args[2];
  updateLines();
}

</script>