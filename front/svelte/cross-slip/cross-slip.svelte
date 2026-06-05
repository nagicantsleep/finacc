<div class="container-fluid crossslip">
  <div class="row mb-3">
    <div class="col-5">
      <div class="input-group date-group">
        <span class="badge bg-secondary year-badge">
          <span class="year-input">{slip.year || ''}</span>
        </span>
        <span class="input-group-text stacked-label">
          <BilingualText key="year" stacked={false} inline={true} />
        </span>
        <input type="date" class="form-control date-picker"
          id="slip-date"
          min={minDate} max={maxDate}
          value={slipDate}
          on:change={onDateChange}>
        {#if slip.no}
        <span class="input-group-text">No. {slip.no}</span>
        {/if}
      </div>
    </div>
    <div class="col">
      <div class="row">
        <div class="col-4 input-group-text stacked-label">
          <BilingualText key="entry_person" stacked={false} inline={true} />:
          <span class="ms-1 person-name">{slip.createrName || ''}</span>
        </div>
        <div class="col-8 input-group-text stacked-label">
          <BilingualText key="approve_person" stacked={false} inline={true} />:
          <span class="ms-1 person-name">{slip.approverName || ''}</span>
          {#if (slip.approvedAt)}
          <span class="ms-2 approved-time">
            ({slip.approvedAt.getFullYear()}{$bi('year_num')}
            {slip.approvedAt.getMonth()+1}{$bi('month_num')}
            {slip.approvedAt.getDate()}{$bi('day')})
          </span>
          {/if}
        </div>
      </div>
    </div>
	</div>
  <div class="row">
    <table class="table table-striped table-bordered">
      <thead class="table-light">
        <th class="col-account"><BilingualText key="debit_account" /></th>
        <th class="col-amount"><BilingualText key="amount" /></th>
        <th><BilingualText key="application" /></th>
        <th class="col-account"><BilingualText key="credit_account" /></th>
        <th class="col-amount"><BilingualText key="amount" /></th>
        <th class="col-action">
        </th>
      </thead>
      <tbody id="cross-slip">
        {#if slip}
        {#each slip.lines as line, i}
        <tr
          on:drop|preventDefault={onDrop}
          on:dragenter|preventDefault={onDragEnter}
          on:dragleave|preventDefault={onDragLeave}
          on:dragover|preventDefault
          data-index={i}
          data-id={line.id}>
          <td class="input">
            <Account
              accounts={accounts}
              bind:code={line.debitAccount }
              bind:sub_code={line.debitSubAccount}></Account>
          </td>
          <td class="number input">
            <input type="text" class="number" autocomplete="off" size="12" maxlength="13"
              bind:value={line.debitAmount}
              on:focusout={() => {
                computeTax(i, 'd');
              }}>
            {#if (( !fy.taxIncluded ) &&
                  ( line.creditAccount !== '3080000' ) &&
                  ( findTaxClass(line.debitAccount, line.debitSubAccount) != 0 ))}
            <input type="text" class="number" size="12" maxlength="13"
              bind:value={line.debitTax}
              on:focusout={makeTaxLine}>
            {/if}
          </td>
          <td class="input">
            <div class="application d-flex">
              {#if showProject}
              <input type="text" size="44" maxlength="51"
                bind:value={line.application1}>
              <div class="project me-auto">
                <select class="form-control" style="line-height:1;padding:0.375rem" bind:value={line.projectId}>
                  <option value={null}><BilingualText key="project_placeholder" /></option>
                  {#each projects as project}
                  <option value={project.id}>{project.name}</option>
                  {/each}
                </select>
              </div>
              {:else}
              <input type="text" size="60" maxlength="61"
                bind:value={line.application1}>
              {/if}
            </div>
            {#if (!fy.taxIncluded)}
            <div class="application d-flex">
              <div class="tax">
                {#if (( line.creditAccount !== '3080000' ) &&
                      ( findTaxClass(line.debitAccount, line.debitSubAccount) > 0 ))}
                <select class="form-control" style="line-height:1;padding:0.375rem"
                  bind:value={line.debitTaxRuleId}
                  on:focusout={() => {
                    console.log('debit focusout');
                    computeTax(i, 'd');
                    makeTaxLine();
                  }}>
                  <option value={null}><BilingualText key="unselected" /></option>
                  {#each taxRules as ent}
                  <option value={ent.id}>{ent.label}</option>
                  {#if ent.taxClass === findTaxClass(line.debitAccount, line.debitSubAccount)}
                  {/if}
                  {/each}
                </select>
                {/if}
              </div>
              <input type="text" size="27" maxlength="51"
                bind:value={line.application2}>
              <div class="tax ms-auto">
                {#if (( !fy.taxIncluded ) &&
                      ( line.debitAccount !== '1140000' ) &&
                      ( findTaxClass(line.creditAccount, line.creditSubAccount) > 0 ))}
                <select class="form-control" style="line-height:1;padding:0.375rem"
                  bind:value={line.creditTaxRuleId}
                  on:focusout={() => {
                    computeTax(i, 'c');
                    makeTaxLine();
                  }}>
                  <option value={null}><BilingualText key="unselected" /></option>
                  {#each taxRules as ent}
                  <option value={ent.id}>{ent.label}</option>
                  {#if ent.taxClass === findTaxClass(line.creditAccount, line.creditSubAccount)}
                  {/if}
                  {/each}
                </select>
                {/if}
              </div>
            </div>
            {:else}
            <div class="application d-flex">
              <input type="text" size="40" maxlength="51"
                bind:value={line.application2}>
            </div>
            {/if}
          </td>
          <td class="input">
            <Account
              accounts={accounts}
              bind:code={line.creditAccount}
              bind:sub_code={line.creditSubAccount}></Account>
          </td>
          <td class="number input">
            <input type="text" class="number" autocomplete="off" size="12" maxlength="13"
              bind:value={line.creditAmount}
              on:focusout={() => {
                computeTax(i, 'c');
              }}>
            {#if (( line.debitAccount !== '1140000' ) &&
                  ( findTaxClass(line.creditAccount, line.creditSubAccount) != 0))}
            <input type="text" class="number" autocomplete="off" size="12" maxlength="13"
              bind:value={line.creditTax}
              on:focusout={makeTaxLine}>
            {/if}
          </td>
          <td class="col-action">
            {#if (slip.approvedAt) }
            {#if ( ( line.debitVoucherId !== null ) || ( line.creditVoucherId !== null ))}
            <Icon icon="fa:file"></Icon>
            {/if}
            {:else}
            <button type="button" class="btn btn-primary btn-sm"
              on:click={() => {
                computeSumAndNext(i);
              }}>
              <i class="fas fa-plus"></i>
            </button>
            {#if ( slip.lines.length > 1 )}
            <button type="button" class="btn btn-danger btn-sm"
              on:click={() => {
                computeSumAndDelete(i);
              }}>
              <i class="fas fa-minus"></i>
            </button>
            {/if}
            {#if ( ( line.debitVoucherId ) || ( line.creditVoucherId ))}
            <button type="button" class="btn btn-warning btn-sm"
              on:click={() => {
                unbindVoucher(i);
              }}>
              <i class="fas fa-link-slash"></i>
            </button>
            {/if}
            {/if}
          </td>
        </tr>
        {/each}
        {/if}
        <tr>
          <td>
          </td>
          <td class="number">
            { sums.debit_amount ? sums.debit_amount.toLocaleString() : ''}<br />
            { sums.debit_tax ? sums.debit_tax.toLocaleString() : ''}
          </td>
          <td><BilingualText key="total" /></td>
          <td>
          </td>
          <td class="number">
            { sums.credit_amount ? sums.credit_amount.toLocaleString() : ''}<br />
            { sums.credit_tax ? sums.credit_tax.toLocaleString() : ''}
          </td>
          <td>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<style>
/* Cross-slip form readability — scoped to .crossslip only.
   All rules use > or descendant selectors of .crossslip so
   they cannot leak to other pages. */

/* (A) Secondary text: inherit parent color (legible on dark th and
   light cells alike); keep it smaller/subordinate. Color handled
   globally in style.css via inherit + opacity. */
:global(.crossslip .bilingual-secondary) {
  font-size: 0.85em;
  line-height: 1.3;
}

/* (C) Date group: compact width */
:global(.crossslip .date-group) {
  flex-wrap: nowrap;
}
:global(.crossslip .year-badge) {
  font-size: 1rem;
  padding: 0.375rem 0.6rem;
  display: inline-flex;
  align-items: center;
}
:global(.crossslip .year-input) {
  background: transparent;
  border: 0;
  color: white;
  font-weight: 600;
  text-align: center;
  width: 4.5ch;
  padding: 0;
}
:global(.crossslip .stacked-label) {
  white-space: nowrap;
  font-size: 0.85em;
  padding: 0.375rem 0.5rem;
  line-height: 1.2;
}
:global(.crossslip .stacked-label .bilingual-text) {
  display: inline-flex;
  flex-direction: row;
  gap: 0.25em;
  align-items: baseline;
}

/* Person display: bold the name, lighter the label */
:global(.crossslip .person-name) {
  font-weight: 600;
}
:global(.crossslip .approved-time) {
  color: var(--bs-gray-600);
  font-size: 0.85em;
}

/* (D) Cell padding/line-height */
:global(.crossslip table) th,
:global(.crossslip table) td {
  padding: 0.5rem 0.6rem;
  vertical-align: middle;
  line-height: 1.5;
}

/* (E) Wider amount cell for amount+tax stacked inputs */
:global(.crossslip .col-amount) {
  width: 150px;
  min-width: 150px;
}
/* Fixed-layout column sizing: give account + action columns explicit
   widths so the Note/application column absorbs the remaining space. */
:global(.crossslip .col-account) {
  width: 18%;
}
:global(.crossslip .col-action) {
  width: 110px;
}

/* (F) Overflow containment (issue #1): the form used fixed `size=`
   character widths on inputs, which forced the table wider than the
   modal and overflowed. Make the table fill the modal and let every
   field shrink to its cell instead of its `size` attribute. */
:global(.crossslip table) {
  width: 100%;
  table-layout: fixed;
}
:global(.crossslip td input[type="text"]),
:global(.crossslip td .search-input),
:global(.crossslip td .form-control),
:global(.crossslip td select) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
/* Flex rows inside the Note/application cell: allow children to shrink
   below their content/`size` width so nothing pushes past the cell. */
:global(.crossslip .application) {
  gap: 0.25rem;
}
:global(.crossslip .application > *) {
  min-width: 0;
}
:global(.crossslip .application > input) {
  flex: 1 1 auto;
}
/* Date picker fills remaining width of the compact date group */
:global(.crossslip .date-picker) {
  flex: 1 1 auto;
  min-width: 0;
}
</style>

<script>
import axios from 'axios';
import Icon from '@iconify/svelte';

import {findTaxClass} from '../../javascripts/cross-slip';
import {numeric, getCompanyInfo, DateString} from '../../../libs/utils';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import Account from './account.svelte';
import {field} from '../../../libs/parse_account_code';
import {findTaxRule, computeTax as _computeTax} from '../../../libs/sales-tax.js';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
export let accounts;
export let slip;
export let fy;
export let taxRules;
let sums;
let projects = [];
let showProject = false;

$: slip.year = slip.month < ( fy.startDate.getMonth() + 1 ) ? fy.endDate.getFullYear() : fy.startDate.getFullYear();

// Date picker (issue #2): single native date input bounded to the
// fiscal-year range. Year stays auto-derived (above) and shown in the
// badge; picking a date writes back month/day.
const pad2 = (n) => ('0' + n).slice(-2);
$: minDate = fy.startDate ? DateString(fy.startDate) : undefined;
$: maxDate = fy.endDate ? DateString(fy.endDate) : undefined;
$: slipDate = ( slip.year && slip.month && slip.day )
  ? `${slip.year}-${pad2(slip.month)}-${pad2(slip.day)}`
  : '';
const onDateChange = (event) => {
  const v = event.target.value; // YYYY-MM-DD
  if ( !v ) {
    slip.day = undefined;
    return;
  }
  const [y, m, d] = v.split('-').map((n) => parseInt(n, 10));
  slip.month = m;
  slip.day = d;
  slip = slip;
};

onMount(async () => {
  try {
    const companyInfo = await getCompanyInfo();
    if (companyInfo && companyInfo.useProjectAccounting) {
      showProject = true;
      const result = await axios.get('/api/projects');
      projects = result.data;
    } else {
      showProject = false;
    }
  } catch (err) {
    console.error($bi('console_error_project_fetch'), err);
    showProject = false;
  }
});

const computeSum = () => {
  //console.log('computeSum');
  let debit_amount = 0;
  let	debit_tax = 0;
  let	credit_amount = 0;
  let	credit_tax = 0;

  for ( let i = 0; i < slip.lines.length ; i ++ ) {
    debit_amount += numeric(slip.lines[i].debitAmount);
    debit_tax += numeric(slip.lines[i].debitTax);
    credit_amount += numeric(slip.lines[i].creditAmount);
    credit_tax += numeric(slip.lines[i].creditTax);
  }
  return	({
    debit_amount: debit_amount,
    debit_tax: debit_tax,
    credit_amount: credit_amount,
    credit_tax: credit_tax
  });
}
const computeTax = (index, dc) => {
  if	( dc == 'd' )	{
    if	( ( slip.lines[index].creditAccount ) &&
          ( slip.lines[index].creditAccount.match(/^114|^308/) ) )	{
    } else {
      if  ( fy.taxIncluded )  {
        slip.lines[index].debitTax = 0;
      } else {
        const rule = findTaxRule(slip.lines[index].debitTaxRuleId, taxRules);
        if  (( rule ) &&
             (rule.taxClass != 9 ))  {
          slip.lines[index].debitTax = _computeTax(slip.lines[index].debitAmount, rule);
        }
      }
    }
  } else {
    if	( slip.lines[index].creditAmount == '=' )	{
      slip.lines[index].creditAmount = slip.lines[index].debitAmount;
    }
    if	( slip.lines[index].creditAmount == '-' )	{
      let sums = computeSum();
      slip.lines[index].creditAmount = sums.debit_amount - sums.credit_amount;
    }
    if	( ( slip.lines[index].debitAccount ) &&
          ( slip.lines[index].debitAccount.match(/^114|^308/) )	)	{
    } else {
      if  ( fy.taxIncluded )  {
        slip.lines[index].creditTax = 0;
      } else {
        const rule = findTaxRule(slip.lines[index].creditTaxRuleId, taxRules);
        if  (( rule ) &&
             (rule.taxClass != 9 ))  {
          slip.lines[index].creditTax = _computeTax(slip.lines[index].creditAmount, rule);
        }
      }
    }
  }
  slip = slip;
}
const makeTaxLine = () => {
  if	( !fy.taxIncluded )	{
    //  1140000 仮払消費税
    //  3080000 仮受消費税
    for ( let i = 0; i < slip.lines.length ; i ++ ) {
      if	( ( ( slip.lines[i].creditAccount ) &&
            ( slip.lines[i].creditAccount.match(/^114|^308/) ) ) ||
          ( ( slip.lines[i].debitAccount ) &&
            ( slip.lines[i].debitAccount.match(/^114|^308/) ) ) )	{
        slip.lines[i].creditAmount = 0;
        slip.lines[i].debitAmount = 0;
        slip.lines[i].creditTax = 0;
        slip.lines[i].debitTax = 0;
      }
    }
    for ( let i = 0; i < slip.lines.length ; i ++ ) {
      if	( slip.lines[i].debitTax > 0 )	{
        let debit = ( field(slip.lines[i].debitAccount) == '6' ) ? '3080000' : (
               ( field(slip.lines[i].debitAccount) == '7' ) ? '1140000' : undefined );
        let gap;
        for	( let j = i + 1;  j < slip.lines.length ; j += 1 )	{
          let line = slip.lines[j];
          if	( ( line.debitAccount == debit ) &&
                ( line.creditAccount == slip.lines[i].debitAccount ) &&
                ( line.creditSubAccount == slip.lines[i].debitSubAccount ) )	{
            gap = j;
          }
        }
        if	( !gap )	{
          gap = slip.lines.length;
          slip.lines.push({
            debitAmount: 0,
            debitTax: 0,
            creditAmount: 0,
            creditTax: 0
          });
        }
        slip.lines[gap].debitAccount = debit;
        slip.lines[gap].debitAmount += numeric(slip.lines[i].debitTax);
        const rule = findTaxRule(slip.lines[i].debitTaxRuleId, taxRules);
        if	( rule && rule.taxClass !== 2 ) {
          slip.lines[gap].creditAccount = slip.lines[i].debitAccount;
          slip.lines[gap].creditSubAccount = slip.lines[i].debitSubAccount;
          slip.lines[gap].creditAmount += numeric(slip.lines[i].debitTax);
        }
      }
      if	( slip.lines[i].creditTax > 0 )	{
        let credit = ( field(slip.lines[i].creditAccount) == '6' ) ? '3080000' : (
               ( field(slip.lines[i].creditAccount) == '7' ) ? '1140000' : undefined );
        let gap;
        for	( let j = i + 1; j < slip.lines.length ; j += 1 )	{
          let line = slip.lines[j];
          if	( ( line.creditAccount == credit ) &&
                ( line.debitAccount == slip.lines[i].creditAccount ) &&
                ( line.debitSubAccount == slip.lines[i].creditSubAccount ) )	{
            gap = j;
          }
        }
        if	( !gap )	{
          gap = slip.lines.length;
          slip.lines.push({
            debitAmount: 0,
            debitTax: 0,
            creditAmount: 0,
            creditTax: 0
          });
        }
        slip.lines[gap].creditAccount = credit;
        slip.lines[gap].creditAmount += numeric(slip.lines[i].creditTax);
        const rule = findTaxRule(slip.lines[i].creditTaxRuleId, taxRules);
        if	( rule && rule.taxClass !== 2 ) {
          slip.lines[gap].debitAccount = slip.lines[i].creditAccount;
          slip.lines[gap].debitSubAccount = slip.lines[i].creditSubAccount;
          slip.lines[gap].debitAmount += numeric(slip.lines[i].creditTax);
        }
      }
    }
  }
}
const computeSumAndNext = (index) => {
  //console.log('computeSumAndNext');
  computeSum();
  //console.log(index, slip.lines.length);
  slip.lines.splice(index + 1, 0, {});
  slip = slip;
}

const computeSumAndDelete = (index) => {
  //console.log('computeSumAndDelete');

  //console.log(index, slip.lines.length);
  slip.lines.splice(index, 1);
  computeSum();
  slip = slip;
}

const unbindVoucher = (i) => {
  slip.lines[i].debitVoucherId = undefined;
  slip.lines[i].creditVoucherId = undefined;
  slip = slip;
}
const bindVoucher = (i, voucher_id) => {
  axios.get(`/api/voucher/${voucher_id}`).then((result) => {
    return(result.data.voucher);
  }).then((voucher) => {
    console.log('voucher', voucher);
    let detail = slip.lines[i];
    if  ( voucher.voucherClass.send ) {
      detail.creditVoucherId = voucher.id;
      detail.creditTax = voucher.tax;
      detail.creditTaxRuleId = voucher.taxRuleId;
    } else {
      detail.debitVoucherId = voucher.id;
      detail.debitTax = voucher.tax;
      detail.debitTaxRuleId = voucher.taxRuleId;
    }
    detail.creditAmount = voucher.amount;
    detail.debitAmount = voucher.amount;
    detail.application2 = voucher.company.name;
    detail.debitAmount = detail.debitAmount != null ? numeric(detail.debitAmount).toLocaleString() : '';
    detail.debitTax = detail.debitTax != null ? numeric(detail.debitTax).toLocaleString() : '';
    detail.creditAmount = detail.creditAmount != null ? numeric(detail.creditAmount).toLocaleString() : '';
    detail.creditTax =  detail.creditTax != null ? numeric(detail.creditTax).toLocaleString() : '';
    slip = slip;
  })
}

let dragCounter = [];
const onDrop = (event) => {
  let index = event.currentTarget.dataset.index;
  let voucher_id = event.dataTransfer.getData('id');
  console.log('onDrop', voucher_id);
  if  ( voucher_id )  {
    bindVoucher(index, voucher_id);
  }
  dragCounter[index] = 0;
  event.currentTarget.classList.remove('over');
  event.stopPropagation();
}

const onDragEnter = (event) => {
	console.log('enter');
  let index = event.currentTarget.dataset.index;
  dragCounter[index] ||= 0;
  dragCounter[index] += 1;
  if  ( dragCounter[index] === 1 ) {
    event.currentTarget.classList.add('over');
  }
  event.stopPropagation();
}
const onDragLeave = (event) => {
  console.log('leave');
  let index = event.currentTarget.dataset.index;
  dragCounter[index] ||= 0;
  dragCounter[index] -= 1;
  if  ( dragCounter[index] === 0 ) {
    event.currentTarget.classList.remove('over');
  }
  event.stopPropagation();
}
beforeUpdate(() => {
  //console.log('cross-slip beforeUpdate');
  sums = computeSum();
  //console.log('sums', sums);
});
afterUpdate(() => {
})

</script>