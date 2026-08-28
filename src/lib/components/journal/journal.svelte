<div class="list">
  <div class="page-title d-flex justify-content-between">
  	<h1 class="page-title-bilingual"><BilingualText key="journal" inline={true} /></h1>
  	<a href="/forms/explanatory-journal/{status?.fy?.term || 1}?format=pdf" download="仕訳日記帳-{today}.pdf" class="btn btn-primary btn-bilingual">
      <BilingualText key="download_journal" inline={true} /><i class="bi bi-download"></i>
  	</a>
	</div>
	<ul class="page-subtitle nav">
  	{#each dates as date}
    	<li class="nav-item">
      	{#if (date.month == month)}
      	<button type="button" class="btn btn-primary month-btn disabled me-2"
        	on:click={() => {
          	openMonth(date.year, date.month);
        	}}>
        	<BilingualText key={`month_${date.month}`} stacked={true} />
      	</button>
      	{:else}
      	<button type="button" class="btn btn-outline-primary month-btn me-2"
      		on:click={() => {
        		openMonth(date.year, date.month);
      		}}>
        	<BilingualText key={`month_${date.month}`} stacked={true} />
      	</button>
      	{/if}
    	</li>
  	{/each}
	</ul>
	<div class="page-subtitle d-flex justify-content-between">
  	<h2 class="d-flex align-items-center gap-3">
  		<BilingualText primary={year} secondary={$bi('year_label')} inline={true} />
  		<BilingualText key={`month_${month}`} inline={true} />
  	</h2>
  	<div>
    	<button type="button" class="btn btn-primary btn-bilingual" id="open-cross-slip"
    		on:click={openSlip}><BilingualText key="journal_detail_entry_space" inline={true} /><i class="bi bi-pencil-square"></i>
      </button>
  	</div>
	</div>
	<JournalList
    {fy}
  	{slips}
  	{lines}
  	{sums}
  	on:open={openSlip} />
</div>
{#if popUp}
{#key modalCount}
<CrossSlipModal
  {accounts}
  {slip}
  {status}
  bind:popUp={popUp}
  on:close={close_} />
{/key}
{/if}

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
import { onMount, afterUpdate } from 'svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import JournalList from './journal-list.svelte';
import CrossSlipModal from '$lib/components/cross-slip/cross-slip-modal.svelte';
import { setAccounts, findAccount, findSubAccountByCode } from '$lib/client/cross-slip.js';
import { numeric } from '$lib/utils.js';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';

export let status = { fy: {} };

let year;
let month;
let fy = {};
let slip = { lines: [] };
let dates = [];
let accounts = [];
let sums = {
  debitAmount: 0,
  debitTax: 0,
  creditAmount: 0,
  creditTax: 0
};
let lines = [];
let slips = [];
let modalCount = 0;
let popUp = false;
let today = '';

const openMonth = (_year, _month) => {
  year = _year;
  month = _month;
  const href = `/journal/${year}/${month}`;
  if (status) status.pathname = href;
  updateList();
  goto(href, { keepFocus: true, noScroll: true });
};

const close_ = () => {
  updateList();
};

const ready = (slipsList) => {
  const _lines = [];
  const _sums = {
    debitAmount: 0,
    debitTax: 0,
    creditAmount: 0,
    creditTax: 0
  };
  if (Array.isArray(slipsList)) {
    for (let i = 0; i < slipsList.length; i++) {
      const s = slipsList[i];
      s.approvedAt = s.approvedAt ? new Date(s.approvedAt) : null;
      if (Array.isArray(s.lines)) {
        for (let j = 0; j < s.lines.length; j++) {
          const line = s.lines[j];

          _sums.debitAmount += line.debitAmount != null ? numeric(line.debitAmount) : 0;
          _sums.debitTax += line.debitTax != null ? numeric(line.debitTax) : 0;
          _sums.creditAmount += line.creditAmount != null ? numeric(line.creditAmount) : 0;
          _sums.creditTax += line.creditTax != null ? numeric(line.creditTax) : 0;

          const debAcc = findAccount(line.debitAccount);
          const debSubAcc = findSubAccountByCode(line.debitAccount, line.debitSubAccount);
          const credAcc = findAccount(line.creditAccount);
          const credSubAcc = findSubAccountByCode(line.creditAccount, line.creditSubAccount);

          _lines.push({
            id: line.id,
            month: s.month,
            day: s.day,
            no: s.no,
            approvedAt: s.approvedAt,
            lineNo: line.lineNo,

            debitAmount: line.debitAmount !== null ? numeric(line.debitAmount).toLocaleString() : '',
            debitTax: line.debitTax != null ? numeric(line.debitTax).toLocaleString() : '',
            debitTaxRule: line.debitTaxRule ? line.debitTaxRule.label : '',
            debitTaxRuleId: line.debitTaxRuleId,
            creditAmount: line.creditAmount !== null ? numeric(line.creditAmount).toLocaleString() : '',
            creditTax: line.creditTax != null ? numeric(line.creditTax).toLocaleString() : '',
            creditTaxRule: line.creditTaxRule ? line.creditTaxRule.label : '',
            creditTaxRuleId: line.creditTaxRuleId,
               
            debitAccount: debAcc ? debAcc.name : line.debitAccount,
            debitSubAccount: debSubAcc ? debSubAcc.name : '',

            creditAccount: credAcc ? credAcc.name : line.creditAccount,
            creditSubAccount: credSubAcc ? credSubAcc.name : '',

            debitVoucher: line.debitVoucher,
            debitVoucherId: line.debitVoucherId,
            creditVoucher: line.creditVoucher,
            creditVoucherId: line.creditVoucherId,

            application1: line.application1 || '',
            application2: line.application2 || '',
            projectName: line.projectData ? line.projectData.name : '',
            projectId: line.projectId
          });
        }
      }
    }
  }
  lines = _lines;
  sums = _sums;
};

const updateList = () => {
  if (!year || !month) return;
  axios.get(`/api/journal/${year}/${month}`).then((result) => {
    slips = result.data.journal || [];
    ready(slips);
  }).catch((e) => {
    console.error('journal list error', e);
  });
};

const setupDates = async () => {
  try {
    let sourceFy = status?.fy?.startDate ? status.fy : null;
    if (!sourceFy) {
      const result = await axios.get(year && month ? `/api/term/${year}/${month}` : '/api/term');
      const terms = Array.isArray(result.data) ? result.data : (result.data?.fiscalYear ? [result.data.fiscalYear] : (result.data?.startDate ? [result.data] : []));
      sourceFy = terms.find((t) => t?.term === (status?.fy?.term || 1)) || terms[0] || null;
    }
    fy = sourceFy || {};
    if (fy?.startDate && fy?.endDate) {
      dates = [];
      const end = new Date(fy.endDate);
      for (let mon = new Date(fy.startDate); mon <= end;) {
        dates.push({
          year: mon.getFullYear(),
          month: mon.getMonth() + 1
        });
        mon.setMonth(mon.getMonth() + 1);
      }
      dates = [...dates];
    } else {
      const y = year || new Date().getFullYear();
      dates = Array.from({ length: 12 }, (_, i) => ({ year: y, month: i + 1 }));
    }
  } catch (e) {
    console.error('setupDates error', e);
    const y = year || new Date().getFullYear();
    dates = Array.from({ length: 12 }, (_, i) => ({ year: y, month: i + 1 }));
  }
};

const setupAccount = async () => {
  try {
    const res = await axios.get('/api/accounts');
    accounts = res.data || [];
    setAccounts(accounts);
    updateList();
  } catch (e) {
    console.error('setupAccount error', e);
  }
};

onMount(async () => {
  const now = new Date();
  today = `${now.getUTCFullYear()}${("00" + (now.getMonth() + 1)).slice(-2)}${("00" + now.getDate()).slice(-2)}`;

  const params = $page.params;
  if (params?.year && params?.month) {
    year = parseInt(params.year);
    month = parseInt(params.month);
  } else {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  slip = {
    year,
    month,
    lines: []
  };

  await setupDates();
  await setupAccount();
});

afterUpdate(() => {
  if (!popUp) {
    modalCount += 1;
  }
});

const openSlip = (event) => {
  slip = event.detail || {};
  if (!slip.no) {
    slip = {
      year: parseInt(year) || new Date().getFullYear(),
      month: parseInt(month) || (new Date().getMonth() + 1),
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
  }
  popUp = true;
};
</script>
