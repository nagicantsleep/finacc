<div class="list">
  <div class="page-title d-flex justify-content-between">
    <h1 class="page-title-bilingual"><BilingualText key="bank_ledger" inline={true} /></h1>
  </div>
  <ul class="page-subtitle d-flex justify-content-between">
    <div class="nav">
    <li class="nav-item dropdown">
      <button type="button"
        class="btn nav-link dropdown-toggle account-dropdown-toggle"
        style="background-color:var(--bs-primary);color:white;"
        role="button" data-bs-toggle="dropdown" aria-expanded="false">
        {#if accountCode}
        <BilingualText key={BANK_ACCOUNTS.find((el) => el[0] == accountCode)[1]} inline={true} />
        {:else}
        <BilingualText key="account" inline={true} />
        {/if}
      </button>
      <ul class="dropdown-menu" aria-labelledby="field">
        {#each BANK_ACCOUNTS as account}
        <li>
          <button type="button" class="btn btn-link dropdown-item account-dropdown-item"
            on:click={() => {
              openAccount(account[0])}
            }>
            <BilingualText primary={account[1]} inline={true} />
          </button>
        </li>
        {/each}
      </ul>
    </li>
    {#each bank_list.subAccounts as bank}
      <li class="nav-item">
        {#if ( subAccountCode === bank.subAccountCode )}
        <button type="button" class="btn btn-info"
          on:click|preventDefault={() => {
            openBank(bank.subAccountCode);
          }}>
          {bank.name}
        </button>
        {:else}
        <button type="button" class="btn btn-outline-info"
          on:click|preventDefault={() => {
            openBank(bank.subAccountCode);
          }}>
          {bank.name}
        </button>
        {/if}
      </li>
    {/each}
    </div>
    <div>
    	<button type="button" class="btn btn-primary" id="open-cross-slip"
        on:click={openSlip}>
        <BilingualText key="voucher_entry" inline />&nbsp;<i class="bi bi-pencil-square"></i>
      </button>
    </div>
  </ul>
  <div class="full-height-2">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" colspan="2">
            <BilingualText key="date_voucher_no" />
          </th>
          <th scope="col" style="width: 150px;">
            <BilingualText key="counter_account" /><br/><BilingualText key="counter_sub_account" />
          </th>
          <th scope="col" style="width: 300px;">
            <BilingualText key="application" /><br/><BilingualText key="sub_account" />
          </th>
          <th scope="col" style="width: 100px;">
            <BilingualText key="payment_amount" />
          </th>
          <th scope="col" style="width: 100px;">
            <BilingualText key="deposit_amount" />
          </th>
          <th scope="col" style="width: 100px;">
            <BilingualText key="balance" />
          </th>
        </tr>
      </thead>
      <tbody>
      {#each lines as line}
        <tr>
          <td style="width:50px;text-align:center;">
            {line.month} / {line.day}
          </td>
          <td style="width:50px;" class={'number ' + ( line.approvedAt ? 'bg-body' : 'bg-warning' )}>
            <button type="button" class="btn btn-link"
              on:click={() => {
                openSlip(line.year, line.month, line.no)
              }}>
              {line.no}
            </button>
          </td>
          <td>
            {line.otherAccount}<br/>
            {line.otherSubAccount}
          </td>
          <td>
            <div class="application">
              {line.application1 || ''}
              {#if line.application2}
              /
              {line.application2}
              {/if}
            </div>
            <div class="application d-flex">
              <div class="tax">
                {line.otherTaxRule}
              </div>
              <div class="">
                {#if (line.debitVoucher )}
                {#each line.debitVoucher.files as file}
                <a href="/voucher/file/{file.id}" target="_blank">
                  <i class="fas fa-file"></i>
                </a>
                {/each}
                {/if}
                {#if (line.creditVoucher )}
                {#each line.creditVoucher.files as file}
                <a href="/voucher/file/{file.id}" target="_blank">
                  <i class="fas fa-file"></i>
                </a>
                {/each}
                {/if}
              </div>
              <div class="ms-auto tax">
                {line.thisTaxRule}
              </div>
            </div>
          </td>
          <td class="number">
            {#if line.showCredit }
            {line.pureCreditAmount ? line.pureCreditAmount.toLocaleString(): ''}
            {/if}
          </td>
          <td class="number">
            {#if line.showDebit }
            {line.pureDebitAmount ? line.pureDebitAmount.toLocaleString(): ''}
            {/if}
          </td>
          <td class="number">
            {line.pureBalance.toLocaleString()}
          </td>
        </tr>
      {/each}
      </tbody>
    </table>
  </div>
</div>
{#if popUp}
{#key modalCount}
<CrossSlipModal
  slip={slip}
  status={status}
  accounts={accounts}
  bind:popUp={popUp}
  on:close={updateList}></CrossSlipModal>
{/key}
{/if}
  
<style>
/* Bilingual H1 + buttons need more height than the global
   `.page-title { height: 50px }` to avoid the H1 overflowing
   into the `.page-subtitle` row (which contains the account
   dropdown — see issue #147). */
.page-title {
  height: auto;
  min-height: 50px;
  flex-wrap: wrap;
  row-gap: 0.25rem;
}
.page-title-bilingual {
  display: inline-flex;
  align-items: center;
  line-height: 1.3;
  margin: 4px 0;
}
.account-dropdown-toggle,
.account-dropdown-item {
  min-height: 44px;
  line-height: 1.2;
  white-space: normal;
  padding: 0.25rem 0.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.account-dropdown-item {
  width: 100%;
  text-align: left;
  text-decoration: none;
}
</style>

<script>
import axios from 'axios';
import {onMount, afterUpdate} from 'svelte';
import {ledgerLines} from '../../../libs/ledger';
import {setAccounts} from '../../javascripts/cross-slip';
import CrossSlipModal from '../cross-slip/cross-slip-modal.svelte';
import BilingualText from '../components/bilingual-text.svelte';
import {DateString} from '../../../libs/utils.js';
import {currentPage} from '../../javascripts/router.js';

export let status;

let	bank_list = { subAccounts: []};
let slip = {
    year: 0,
    month: 0,
    lines: []
  };
let	lines = [];
let	accounts;
let modalCount = 0;
let popUp;

$: checkPage($currentPage);

const BANK_ACCOUNTS = [
  [ '1010000',	'bank_checking_dep' ],
  [ '1010010',	'bank_savings_dep' ],
  [ '1010020',	'bank_time_dep' ],
  [ '1010030',	'bank_fixed_dep' ]
];

const link = (href) => {
  window.history.pushState(status, "", href);
  currentPage.set(href);
}

let accountCode;
let subAccountCode;

const openAccount = (_account) => {
  accountCode = _account;
  subAccountCode = undefined;
  link(`/bank-ledger/${accountCode}`);
}
const openBank = (id) => {
  subAccountCode = id;
  link(`/bank-ledger/${accountCode}/${subAccountCode}`);
}

const checkPage = (page) => {
  page = page || location.pathname;
  const args = page.split('/');
  accountCode = args[2];
  subAccountCode = args[3] ? parseInt(args[3]) : undefined;
  console.log('checkPage', args, accountCode, subAccountCode);
  updateAccount();
  if ( subAccountCode ) {
    updateList();
  } else {
    lines = [];
  }
}

onMount(async () => {
  lines = [];
  bank_list = { subAccounts: []};
  let result = await axios.get('/api/accounts');
  accounts = result.data;
  setAccounts(accounts);

  checkPage();

});
afterUpdate(() => {
  if  (!popUp)  {
    modalCount += 1;
  }
})

const updateAccount = () => {
  if	( accountCode )	{
    axios.get(`/api/account/${accountCode}`).then((result) => {
      bank_list = result.data;
    });
  } else {
    bank_list = { subAccounts: [] };
  }
}

const updateList = () => {
  if	( subAccountCode )	{
    axios.get(`/api/remaining/${status.fy.term}/${accountCode}/${subAccountCode}`).then((result) => {
      let remaining = result.data;

      axios.get(`/api/ledger/${status.fy.term}/${accountCode}/${subAccountCode}`).then((result) => {
        let details = result.data;
        let ret = ledgerLines(accountCode, subAccountCode, remaining, details);
        lines = ret.lines;
      });
    });
  }
}

const	openSlip = (year, month, no) => {
  if  ( !no ) {
    slip = {
      year: status.fy.startDate.getFullYear(),
      month: status.fy.startDate.getMonth()+1,
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
  } else {
    axios.get(`/api/cross_slip/${year}/${month}/${no}`).then((result) => {
      let data = result.data;
      slip = {
        year: data.year,
        month: data.month,
        day: data.day,
        no: data.no,
        createdBy: data.createdBy,
        approvedAt: data.approvedAt ? new Date(data.approvedAt): null,
        createrName: data.creater ? data.creater.name: '',
        approverName: data.approver ? data.approver.name : '',
        lines: data.lines
      };
      popUp = true;
    });
  }
}
</script>
