<div class="list">
  <div class="list-header d-flex flex-column gap-2">
    <div class="page-title d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h1 class="page-title-bilingual mb-0"><BilingualText key="voucher_list" inline={true} /></h1>
      <button type="button" class="btn btn-primary btn-bilingual flex-shrink-0"
    	  on:click={() => {
      	  openVoucher(null);
    	  }}
  		  id="voucher-info"><BilingualText key="voucher_entry_space" inline={true} /><i class="bi bi-pencil-square"></i>
      </button>
    </div>
    <ul class="page-subtitle nav me-auto flex-wrap mb-0">
      {#each dates as date (date.ym)}
        <li class="nav-item">
          {#if filters.month === date.ym}
          <button type="button" class="btn btn-primary month-btn disabled me-2"
            on:click={() => {
              dispatch('filter', { month: `${date.year}-${date.month}` });
            }}>
            <BilingualText key={`month_${date.month}`} stacked={true} />
          </button>
          {:else}
          <button type="button" class="btn btn-outline-primary month-btn me-2"
            on:click={() => {
              dispatch('filter', { month: `${date.year}-${date.month}` });
            }}>
            <BilingualText key={`month_${date.month}`} stacked={true} />
          </button>
          {/if}
        </li>
      {/each}
      <li class="nav-item">
        {#if !filters.month}
        <button type="button" class="btn btn-primary month-btn disabled me-2"
          on:click={() => {
            dispatch('filter', { month: undefined });
          }}>
          <BilingualText key="all" stacked={true} />
        </button>
        {:else}
        <button type="button" class="btn btn-outline-primary month-btn me-2"
          on:click={() => {
            dispatch('filter', { month: undefined });
          }}>
          <BilingualText key="all" stacked={true} />
        </button>
        {/if}
      </li>
    </ul>
  </div>
  <div class="full-height-2 fontsize-12pt table-responsive">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 150px;"><BilingualText key="kind" /></th>
          <th scope="col" style="width: 200px;"><BilingualText key="counterparty" /></th>
          <th scope="col" style="width: 120px;"><BilingualText key="occurrence_date" /></th>
          <th scope="col" style="width: 120px;"><BilingualText key="payment_date" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="amount" /></th>
          <th scope="col"><BilingualText key="description" /></th>
          <th scope="col" style="width:150px;"><BilingualText key="file" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="processor" /></th>
        </tr>
      </thead>
      <tbody>
        <tr style="height:25px;">
          <td>
            <select class="form-select"
                on:input={changeVoucherType}
                value={filters.type ? parseInt(filters.type, 10) : -1}>
              <option value={-1}><BilingualText key="all" /></option>
              {#each voucherClasses as voucherClass (voucherClass.id)}
              <option value={voucherClass.id}>{voucherClass.name}</option>
              {/each}
            </select>
          </td>
          <td>
            <CompanySelect
                bind:value={companyId}
                on:input={changeCompany}>
            </CompanySelect>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
            <input type="text" class="number" placeholder={$bi('lower_limit')} size="18" maxlength="13"
                bind:value={lowerAmount}
                on:keypress={changeAmount} />
            <input type="text" class="number" placeholder={$bi('upper_limit')} size="18" maxlength="13"
                bind:value={upperAmount}
                on:keypress={changeAmount} />
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
        </tr>
        {#each vouchers as line (line.id)}
        <tr>
          <td>
            <button type="button" class="btn btn-link"
              on:click={() => {
                openVoucher(line.id);
              }}
              >
              {line.voucherClass ? line.voucherClass.name : '__'}
            </button>
          </td>
          <td>
            {line.company.name}
          </td>
          <td>
            {#if ( line.details.length > 0 ) }
            <button type="button" class="btn btn-link text-primary"
              on:click|preventDefault={() => {
                dispatch('slip', {
                  year: line.details[0].crossSlip.year,
                  month: line.details[0].crossSlip.month,
                  day: line.details[0].crossSlip.day,
                  no: line.details[0].crossSlip.no
                });
              }}>
              {formatDate(line.issueDate)}<br/>
              ({line.details[0].crossSlip.month}-{line.details[0].crossSlip.no})
            </button>
            {:else}
            <button type="button" class="btn btn-link text-danger"
              on:click|preventDefault={() => {
                let issueDate = new Date(line.issueDate);
                dispatch('slip', {
                  year: issueDate.getFullYear(),
                  month: issueDate.getMonth()+1,
                  day: issueDate.getDate()
                });
              }}>
              {formatDate(line.issueDate)}
            </button>
            {/if}
          </td>
          <td>
            {#if (	line.paymentDate &&
                 ( line.details.length > 0 ) &&
                compDate(line.paymentDate,
                line.details[0].crossSlip.year,
                line.details[0].crossSlip.month,
                line.details[0].crossSlip.day) ) }
            <button type="button" class="btn btn-link"
              on:click|preventDefault={() => {
                dispatch('slip', {
                  year: line.details[0].crossSlip.year,
                  month: line.details[0].crossSlip.month,
                  day: line.details[0].crossSlip.day,
                  no: line.details[0].crossSlip.no
                });
              }}>
                {formatDate(line.paymentDate)}
            </button>
            {:else}
            {line.paymentDate ? formatDate(line.paymentDate) : ''}
            {/if}
          </td>
          <td class="number">
            {numeric(line.amount).toLocaleString()}
          </td>
          <td>
            {line.description || ''}
          </td>
          <td style="height:25px;">
            {#each line.files as file}
            <div class="file-item">
              <a href="/voucher/file/{file.id}" target="_blank">
                {#if ( file.mimeType.match(/^image\//) ) }
                <img src="data:{file.mimeType};base64,{(file.body)}"
                  class="rect-image"/>
                {:else if ( file.name.match(/\.pdf$/) ) }
                <img src="/icons/icon_pdf.png" class="rect-image" />
                {/if}
              </a>
            </div>
            {/each}
          </td>
          <td>
            {line.updateUser.name}
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
.file-item {
  width:40px;
  height:40px;
  padding:5px;
  float: left;
}
.rect-image {
  width:40px;
  clip:rect(0,40px,40px,0);
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
import CompanySelect from '$lib/components/CompanySelect.svelte';
import { numeric, formatDate } from '$lib/utils.js';
import { createEventDispatcher } from 'svelte';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';

const dispatch = createEventDispatcher();

export let status;
export let vouchers = [];
export let voucherClasses = [];
export let dates = [];
export let filters = {};

let companyId = filters.company || '';
let upperAmount = filters.upper || '';
let lowerAmount = filters.lower || '';

$: companyId = filters.company || '';
$: upperAmount = filters.upper || upperAmount;
$: lowerAmount = filters.lower || lowerAmount;

const compDate = (date, year, month, day) => {
  const ymd = date.split('-');
  return (
    parseInt(ymd[0], 10) === year &&
    parseInt(ymd[1], 10) === month &&
    parseInt(ymd[2], 10) === day
  );
};

const changeVoucherType = (event) => {
  const value = parseInt(event.currentTarget.value, 10);
  dispatch('filter', {
    type: Number.isFinite(value) && value > 0 ? value : undefined
  });
};

const changeCompany = (event) => {
  dispatch('filter', {
    company: event.detail || undefined
  });
};

const changeAmount = (event) => {
  if (event.keyCode === 13) {
    dispatch('filter', {
      upper: upperAmount ? numeric(upperAmount) : undefined,
      lower: lowerAmount ? numeric(lowerAmount) : undefined
    });
  }
};

const openVoucher = (id) => {
  let voucher;
  if (id) {
    voucher = vouchers.find((row) => row.id == id);
  } else {
    voucher = null;
  }
  dispatch('open', voucher);
};
</script>
