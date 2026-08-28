<div class="page-title d-flex justify-content-between">
  <h1 class="page-title-bilingual"><BilingualText key="ledger" inline={true} /></h1>
  <a href="/forms/general-ledger/{status?.fy?.term || 1}?format=pdf" download="総勘定元帳-{today}.pdf" class="btn btn-primary btn-bilingual">
    <BilingualText key="download_general_ledger" inline={true} /><i class="bi bi-download"></i>
  </a>
</div>
<AccountSelect
  on:select={(event) => {
    accountSelect(event.detail);
  }}
  {fields} />
<nav class="page-subtitle navbar d-flex justify-content-between">
  {#if (account)}
  <button type="button" class="btn btn-link fs-4"
    on:click={() => {
      accountSelect({
      	code: account.accountCode
    	});
    }}>
    <BilingualText primary={account.name} secondary={account.nameVi} inline={true} />
  </button>
  {/if}
  <div>
    {#if (account)}
    <button type="button" class="btn btn-outline-primary btn-bilingual me-2"
      on:click={() => {
        if (subAccountCode) {
          link(`/changes/${status?.fy?.term || 1}/${accountCode}/${subAccountCode}`);
        } else {
          link(`/changes/${status?.fy?.term || 1}/${accountCode}`);
        }
      }}><BilingualText key="view_trends" inline={true} /></button>
    {/if}
    <button type="button" class="btn btn-primary btn-bilingual" id="open-cross-slip"
    	on:click={openSlip}>
      <BilingualText key="voucher_entry" inline={true} /><i class="bi bi-pencil-square"></i>
    </button>
  </div>
</nav>
{#if (account && (account.subAccounts?.length > 0))}
  <div class="row page-subtitle">
    <div class="col-8">
      {#key subAccountCode}
  		<SubAccountSelect
    		on:select={(event) => {
      		accountSelect(event.detail);
    		}}
    		{account}
    		sub_account_code={subAccountCode} />
      {/key}
    </div>
    <div class="col-4" style="text-align:right;">
      <button type="button" class="btn btn-outline-primary btn-bilingual me-2"
        on:click={() => {
          link(`/changes/${status?.fy?.term || 1}/${accountCode}/${subAccountCode}`);
        }}
        disabled={!subAccountCode}><BilingualText key="view_trends" inline={true} /></button>
      <a href="/forms/subsidiary-ledger/{status?.fy?.term || 1}?format=pdf" download="補助元帳-{today}.pdf" class="btn btn-primary btn-bilingual">
        <BilingualText key="download_sub_ledger" inline={true} /><i class="bi bi-download"></i>
      </a>
    </div>
  </div>
{/if}
<div class="full-height-4" style="overflow-y: auto;">
	<LedgerList
  	{account}
  	{pickup}
  	{sums}
  	{lines}
  	bind:status={status}
  	on:link={_link}
  	on:select={(event) => {
    	accountSelect(event.detail);
  	}}
    on:open={openSlip} />
</div>
{#if popUp}
{#key modalCount}
<CrossSlipModal
  {slip}
  {status}
  {accounts}
  bind:popUp={popUp}
  on:close={updateList} />
{/key}
{/if}

<style>
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
.page-title {
  margin-top: 0.75rem;
  margin-bottom: 1rem;
}
</style>

<script>
import axios from 'axios';
import { onMount, afterUpdate } from 'svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import LedgerList from './ledger-list.svelte';
import CrossSlipModal from '$lib/components/cross-slip/cross-slip-modal.svelte';
import { ledgerLines } from '$lib/shared/ledger-lines.js';
import AccountSelect from '$lib/components/AccountSelect.svelte';
import SubAccountSelect from '$lib/components/AccountSelect.svelte';
import { setAccounts } from '$lib/client/cross-slip.js';
import parse_account_code from '$lib/shared/parse_account_code.js';
import { bi, languagePair } from '$lib/i18n/bilingual.js';
import BilingualText from '$lib/components/BilingualText.svelte';

export let status = { fy: {} };

let modalCount = 0;
let popUp = false;
let accounts = [];
let account;
let details = [];
let remaining = [];
let slip = {
  year: 0,
  month: 0,
  lines: []
};
let pickup;
let sums;
let lines = [];
let fields = [
  {
    titleKey: 'chart_assets',
    accounts: []
  },{
    titleKey: 'chart_liabilities',
    accounts: []
  },{
    titleKey: 'chart_net_assets',
    accounts: []
  },{
    titleKey: 'chart_revenue',
    accounts: []
  },{
    titleKey: 'chart_cost_of_sales',
    accounts: []
  },{
    titleKey: 'chart_non_operating',
    accounts: []
  }
];
let today = '';
let accountCode = '1000000';
let subAccountCode;

const link = (href) => {
  goto(href, { keepFocus: true, noScroll: true });
};

const _link = (event) => {
  link(event.detail);
};

const lpQuery = () => {
  const pair = $languagePair;
  return `?languagePair=${encodeURIComponent(JSON.stringify(pair))}`;
};

$: if ($languagePair && accountCode) {
  update(false);
}

const accountSelect = (code) => {
  let href;
  if (code.sub) {
    href = `/ledger/${code.code}/${code.sub}`;
  } else {
    href = `/ledger/${code.code}`;
  }
  accountCode = code.code;
  subAccountCode = code.sub;
  link(href);
};

const update = async (loadDetails) => {
  if (!accountCode) return;
  try {
    const result = await axios.get(`/api/account/${accountCode}${lpQuery()}`);
    account = result.data;
    if (loadDetails && status?.fy?.term) {
      const term = status.fy.term;
      const remRes = await axios.get(subAccountCode ? `/api/remaining/${term}/${accountCode}/${subAccountCode}` : `/api/remaining/${term}/${accountCode}`);
      remaining = remRes.data || [];
      updateList();
    }
  } catch (e) {
    console.error('ledger update error', e);
  }
};

const checkPage = (params) => {
  accountCode = params?.accountCode || accountCode || '1000000';
  subAccountCode = params?.subAccountCode ? parseInt(params.subAccountCode) : undefined;
  update(true);
};

$: checkPage($page.params);

onMount(async () => {
  const now = new Date();
  today = `${now.getUTCFullYear()}${("00" + (now.getMonth() + 1)).slice(-2)}${("00" + now.getDate()).slice(-2)}`;

  try {
    const res = await axios.get(`/api/accounts${lpQuery()}`);
    accounts = res.data || [];
    setAccounts(accounts);
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      switch (parse_account_code.field(acc.code)) {
        case '1':
        case '2':
          fields[0].accounts.push(acc);
          break;
        case '3':
        case '4':
          fields[1].accounts.push(acc);
          break;
        case '5':
          fields[2].accounts.push(acc);
          break;
        case '6':
          fields[3].accounts.push(acc);
          break;
        case '7':
          fields[4].accounts.push(acc);
          break;
        default:
          fields[5].accounts.push(acc);
          break;
      }
    }
    fields = fields;
  } catch (e) {
    console.error('accounts load error in ledger', e);
  }

  checkPage($page.params);
});

afterUpdate(() => {
  if (!popUp) {
    modalCount += 1;
  }
});

const updateList = async () => {
  if (!accountCode || !status?.fy?.term) return;
  const term = status.fy.term;
  try {
    const pr = subAccountCode 
      ? axios.get(`/api/ledger/${term}/${accountCode}/${subAccountCode}${lpQuery()}`)
      : axios.get(`/api/ledger/${term}/${accountCode}${lpQuery()}`);
    const result = await pr;
    details = result.data || [];
    const ret = ledgerLines(accountCode, subAccountCode, remaining, details);
    lines = ret.lines || [];
    sums = ret.sums || {};
    pickup = ret.pickup;
  } catch (e) {
    console.error('ledger list update error', e);
  }
};

const openSlip = (event) => {
  const dataset = event.detail;
  if (dataset?.no) {
    axios.get(`/api/cross_slip/${dataset.year}/${dataset.month}/${dataset.no}`).then((result) => {
      const data = result.data;
      slip = {
        year: data.year,
        month: data.month,
        day: data.day,
        no: data.no,
        createdBy: data.createdBy,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        createrName: data.creater ? data.creater.name : '',
        approverName: data.approver ? data.approver.name : '',
        lines: data.lines
      };
      popUp = true;
    });
  } else {
    const fyStartDate = status?.fy?.startDate ? new Date(status.fy.startDate) : new Date();
    slip = {
      year: fyStartDate.getFullYear(),
      month: fyStartDate.getMonth() + 1,
      lines: [{
        debitAccount: "",
        debitSubAccount: 0,
        debitAmount: "",
        debitTax: "",
        creditAccount: "",
        creditSubAccount: 0,
        creditAmount: "",
        creditTax: "",
      }]
    };
    popUp = true;
  }
};
</script>