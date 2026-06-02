<table class="table table-bordered">
  <thead class="table-light">
    <tr>
      <th scope="col" colspan="2"><BilingualText key="date_voucher_no" /></th>
      <th scope="col" style="width: 150px;"><BilingualText key="counter_account" /><br/><BilingualText key="counter_sub_account" /></th>
      <th scope="col" style="width: 300px;"><BilingualText key="application" /><br/><BilingualText key="sub_account" /></th>
      <th scope="col" style="width: 100px;"><BilingualText key="debit_amount" /></th>
      <th scope="col" style="width: 100px;"><BilingualText key="credit_amount" /></th>
      <th scope="col" style="width: 100px;"><BilingualText key="balance" /></th>
    </tr>
  </thead>
  <tbody>
    {#if ( pickup )}
    <tr style="height:12px;">
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
      <td><BilingualText key="carry_forward_amount" /></td>
      <td class="number">
      </td>
      <td class="number">
      </td>
      <td class="number">
        {pickup.balance.toLocaleString()}
      </td>
    </tr>
    {/if}
    {#each lines as line}
    <tr style="height:36px;">
      <td style="width:50px;text-align:center;">
        <button type="button" class="btn btn-link"
        	on:click={() => {
            dispatch('link', `/journal/${line.year}/${line.month}`);
          }}>
          {line.month}/{line.day}
        </button>
      </td>
      <td class="number" style="width:50px;">
        <button type="button" class="btn btn-link"
          on:click={() => {
            dispatch('open', {
							year: line.year,
							month: line.month,
							no: line.no
						});
          }}>
          {line.no}
        </button>
      </td>
      <td>
        {line.otherAccount}<br/>
        {line.otherSubAccount}
      </td>
      <td>
        <div class="appication">
          {line.application1 ? line.application1 : ''}
          {#if line.application2 }
          /
          {line.application2}
          {/if}
        </div>
        <div class="application d-flex">
          {#if line.projectId}
          <div class="project me-2 text-truncate" style="max-width: 150px;" title={line.projectName}>
            <i class="fas fa-briefcase me-1"></i><a href={`/project/entry/${line.projectId}`}>{line.projectName}</a>
          </div>
          <div class="me-2 border-end"></div>
          {/if}
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
        {#if (line.subAccount)}
        <div class="application">
          <button type="button" class="btn btn-link"
          	on:click={() => {
              dispatch('select', {
    						code: account.accountCode,
    						sub: line.subAccountCode
              });
      			}}>
            {line.subAccount}
          </button>
        </div>
        {/if}
      </td>
      <td class="number">
        {line.debitTaxRule}<br/>
        {#if (line.showDebit)}
        <span>
          {line.pureDebitAmount ? line.pureDebitAmount.toLocaleString(): ''}<br/>
          {line.pureDeitTax ? line.pureDebitTax.toLocaleStrine(): ''}
        </span>
        {/if}
      </td>
      <td class="number">
        {line.creditTaxRule}<br/>
        {#if (line.showCredit)}
        <span>
          {line.pureCreditAmount ? line.pureCreditAmount.toLocaleString(): ''}<br/>
          {line.pureCreditTax ? line.pureCreditTax.toLocaleString() : ''}
        </span>
        {/if}
      </td>
      <td class="number">
        <br/><br/>
        {line.pureBalance.toLocaleString()}
      </td>
    </tr>
    {/each}
    {#if (sums)}
    <tr style="height:36px;">
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
      <td><BilingualText key="total" /></td>
      <td class="number">
        {sums.debitAmount.toLocaleString()}<br/>
        {sums.debitTax.toLocaleString()}
      </td>
      <td class="number">
        {sums.creditAmount.toLocaleString()}<br/>
        {sums.creditTax.toLocaleString()}
      </td>
      <td class="number">
        {sums.balance.toLocaleString()}
      </td>
    </tr>
    {/if}
  </tbody>
</table>

<script>
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import BilingualText from '../components/bilingual-text.svelte';
const dispatch = createEventDispatcher();

export	let status;
export	let	account;
export	let pickup;
export	let sums;
export	let lines = [];

const link=(href) => {
}
</script>
