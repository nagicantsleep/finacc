<div class="modal" id={ id ? id : "cross-slip-modal"} tabindex="-1" data-bs-backdrop="static">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalLabel"><BilingualText key="journal_detail_entry" /></h5>
        <button type="button" class="btn-close" id="close-button" area-label="Close"
          on:click={close_}></button>
      </div>
      <div class="modal-body">
        {#if !ok }
        <div class="border rounded border-danger mb-2 ms-2 me-2 p-3">
          <h5 class="fs-5 text-danger"><i class="bi bi-exclamation-triangle-fill"></i>&nbsp;<BilingualText key="error" inline /></h5>
          <ul>
            {#each errorMessages as errorMessage}
              <li class="text-danger">{errorMessage}</li>
            {/each}
          </ul>
        </div>
        {/if}
        <CrossSlip
          bind:slip={slip}
          fy={status.fy}
          accounts={accounts}
          {taxRules}
          ></CrossSlip>
        {#if (vouchers)}
        <table class="table table-striped table-bordered">
          <thead class="table-light">
            <th style="width:20px;">

            </th>
            <th style="width:100px;">
              <BilingualText key="kind" />
            </th>
            <th style="width:200px;">
              <BilingualText key="counterparty" />
            </th>
            <th style="width:100px;">
              <BilingualText key="amount" />
            </th>
            <th>
              <BilingualText key="description" />
            </th>
          </thead>
          <tbody>
            {#each vouchers as line}
            <tr
              on:dragstart={onDragStart}
              on:dragend={onDragEnd}
              draggable={ line.details.length > 0  ? "false" : "true" }
              data-id={line.id}>
              <td>
                {#if (line.details.length > 0 )}
                <i class="fas fa-link"></i>
                {/if}
              </td>
              <td>
                {line.voucherClass ? line.voucherClass.name : '__'}
              </td>
              <td>
                {line.company.name}
              </td>
              <td class="number">
                {numeric(line.amount).toLocaleString()}
              </td>
              <td>
                {line.description || ''}
              </td>
            </tr>
            {/each}
          </tbody>
        </table>
        {/if}
      </div>
      <div class="modal-footer">
        {#if (( !slip ) ||
            (( !slip.approvedAt ) &&
             (( status.user.accounting ) ||
              ( slip.createdBy == status.user.id )))) }
          <button type="button" class="btn btn-secondary"
          	on:click={openVouchers}><BilingualText key="voucher_evidence" /></button>
          {/if}
          {#if ( slip && slip.no > 0) }
          {#if ( status.user.approvable )}
            {#if ( slip.approvedAt )}
            <button type="button" class="btn btn-warning" id="disapprove-button"
              on:click={disapprove}><BilingualText key="disapprove" /></button>
            {:else}
            <button type="button" class="btn btn-warning" id="approve-button"
              on:click={approve}><BilingualText key="approve" /></button>
            <button type="button" class="btn btn-danger" id="delete-button"
              on:click={delete_}><BilingualText key="delete" /></button>
            {/if}
          {/if}
        {/if}
        {#if (( !slip ) || 
            (( !slip.approvedAt ) &&
             (( status.user.accounting ) ||
              ( slip.createdBy == status.user.id ))))}
          <button type="button" class="btn btn-primary" id="save-button"
            on:click={save}><BilingualText key="save" /></button>
        {/if}
      </div>
    </div>
  </div>
</div>
<script>

import {numeric, dateStr, DateString, getCompanyInfo} from '../../../libs/utils';
import axios from 'axios';
import Modal from 'bootstrap/js/dist/modal';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import CrossSlip from './cross-slip.svelte';
import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';


export let accounts;
export let slip;
export let status;
export let popUp;
export let id;

let modal;
let vouchers;
let ok = true;
let errorMessages = [];
let taxRules = [];

const clean_popup = () => {
  dispatch('close');
  popUp = false;
  modal.hide();
  modal.dispose();
  vouchers = undefined;
  errorMessages = [];
  ok = true;
}
const onDragStart = (event) => {
  event.dataTransfer.dropEffect = 'link';
  event.dataTransfer.setData("id", event.currentTarget.dataset.id);
}
const onDragEnd = (event) => {

}
onMount(async () => {
  console.log('onMount cross-slip-modal', slip);
  let date;
  if  ( slip.year ) {
    date = dateStr(slip.year, slip.month);
  } else {
    date = DateString(status.fy.startDate);
  }
  console.log({date});
  const result = await axios.get(`/api/tax-rule?type=active&date=${date}`);
  taxRules = result.data.values;
  console.log(taxRules);
  modal = new Modal(document.getElementById('cross-slip-modal'));
  modal.show();
});
beforeUpdate(() => {
  //console.log('cross-slip-modal', slip);
})
afterUpdate(() => {
  //console.log('afterUpdate cross-slip-modal');
});

const save = (event) => {
  errorMessages = [];
  ok = true;
  let tempDay = slip.day;
  slip.day = parseInt(slip.day);
  if	(	( slip.day )
    &&	( slip.day > 0 )
    &&	( slip.day <= 31 ) )	{
    slip.term = status.fy.term;
    let sums = {
      debit: 0,
      credit: 0
    };
    for	( let i = 0 ; i < slip.lines.length; i ++ )	{
      if (slip.lines[i].debitAccount === 'sundries') {
        slip.lines[i].debitAccount = null;
      }
      if (slip.lines[i].creditAccount === 'sundries') {
        slip.lines[i].creditAccount = null;
      }
      slip.lines[i].creditAmount = numeric(slip.lines[i].creditAmount);
      slip.lines[i].debitAmount = numeric(slip.lines[i].debitAmount);
      slip.lines[i].creditTax = numeric(slip.lines[i].creditTax);
      slip.lines[i].debitTax = numeric(slip.lines[i].debitTax);
      slip.lines[i].description1 = slip.lines[i].description1 || '';
      slip.lines[i].description2 = slip.lines[i].description2 || '';
      slip.lines[i].debitVoucher = undefined;
      slip.lines[i].creditVoucher = undefined;
      sums.debit += slip.lines[i].debitAmount;
      sums.credit += slip.lines[i].creditAmount;
      if (( !slip.lines[i].debitAccount ) &&
          ( slip.lines[i].debitAmount != 0 ) )	{
        ok = false;
        errorMessages.push(`${i+1}{$bi('row_label')} : {$bi('error_debit_unregistered')}`);
      }
      if  (( !slip.lines[i].debitAccount ) &&
           ( slip.lines[i].debitAmount != 0 ))  {
        ok = false;
        errorMessages.push(`${i+1}{$bi('row_label')} : {$bi('error_debit_missing')}`);
      }
      if  (( !slip.lines[i].creditAccount ) &&
           ( slip.lines[i].creditAmount != 0 ))	{
        ok = false;
        errorMessages.push(`${i+1}{$bi('row_label')} : {$bi('error_credit_missing')}`);
      }
    }
    if	( sums.debit != sums.credit )	{
      ok = false;
      errorMessages.push($bi('error_debit_credit_mismatch'));
    }
  } else {
    ok = false;
    slip.day = tempDay;
    errorMessages.push($bi('error_invalid_date'));
  }
  if	( ok )	{
    console.log("保存直前のslipオブジェクト:", JSON.stringify(slip, null, 2));
    try {
      let pr;
      if ( slip.no  ) {
        pr = axios.put('/api/cross_slip', slip);
      } else {
        pr = axios.post('/api/cross_slip', slip);
      }
      pr.then(() => {
        close_();
      });
    } catch(e) {
      console.log(e);
      // can't save
      //	TODO alert
    }
  } else {
    errorMessages = errorMessages;
  }
};

const close_ = (event) => {
  clean_popup();
};

const delete_ = (event) => {
  try {
    //console.log('delete');
    axios.delete('/api/cross_slip', {
      data: {
        year: slip.year,
        month: slip.month,
        day: slip.day,
        no: slip.no
      }
    }).then((result) => {
      clean_popup();
    });
  } catch(e) {
    console.log(e);
    // can't delete
    //	TODO alert
  }
}

const disapprove = (event) => {
  slip.approvedAt = null;
  axios.put('/api/cross_slip/approve', {
    year: slip.year,
    month: slip.month,
    no: slip.no,
    approvedAt: slip.approvedAt
  }).then(() => {
    slip.approverName = undefined;
    //close_();
  })
}
const approve = (event) => {
  slip.approvedAt = new Date();
  axios.put('/api/cross_slip/approve', {
    year: slip.year,
    month: slip.month,
    no: slip.no,
    approvedAt: slip.approvedAt
  }).then(() => {
    slip.approverName = status.user.name;
    close_();
  })
}

const openVouchers = (event) => {
  if	( vouchers )	{
    vouchers = undefined;
  } else {
    vouchers = [];
    const dateParam = slip.day
      ? `${slip.year}-${slip.month}-${slip.day}`
      : `${slip.year}-${slip.month}`;
    const voucherParams = slip.day ? { date: dateParam } : { month: dateParam };
    axios.get(`/api/voucher/`, {
      params: voucherParams
    }).then((result) => {
      vouchers = result.data.vouchers;
      console.log('vouchers', vouchers);
    })
  }
}
</script>
