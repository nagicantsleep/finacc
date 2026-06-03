<FrontCover
  titleKey="journal"
  {company}
  {fy}
  ></FrontCover>
{#each dates as date}
{#each date.pages as page, pc}
<div class="page">
  <div class="detail-page">
    <PageHeader
      {company}
      {fy}
      titleKey="journal"
      left_item={`${date.month}${$bi('month_num')}`}
    ></PageHeader>
    <div class="page-body">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th scope="col" colspan="2"><BilingualText key="date_voucher_no" /></th>
            <th scope="col" style="width: 120px;"><BilingualText key="debit_amount" /></th>
            <th scope="col" style="width: 100px;"><BilingualText key="debit_account" stacked={false} /><br/><BilingualText key="sub_account" stacked={false} /></th>
            <th scope="col"><BilingualText key="application" /></th>
            <th scope="col" style="width: 120px;"><BilingualText key="credit_account" stacked={false} /><br/><BilingualText key="sub_account" stacked={false} /></th>
            <th scope="col" style="width: 100px;"><BilingualText key="credit_amount" /></th>
          </tr>
        </thead>
        <tbody>
          {#each page as line}
          <tr style="height:38px;vertical-align:top;">
            <td style="width:40px;text-align:center;">
              {line.month}/{line.day}
            </td>
            <td style="width:25px;" class="number">
              {line.no}
            </td>
            <td class="number">
              {#if ( line.debitAccount !== '')}
              {formatMoney(line.debitAmount)}<br/>
              {formatMoney(line.debitTax)}
              {/if}
            </td>
            <td class="text">
              {line.debitAccount}<br/>
              {line.debitSubAccount}
            </td>
            <td class="text">
              <div class="appication">
                {line.application1}
              </div>
              <div class="appication">
                {line.application2}
              </div>
              <div class="application d-flex">
                <div class="tax text">
                  {line.debitTaxRule ? line.debitTaxRule.label : ''}
                </div>
                <div class="tax ms-auto text">
                  {line.creditTaxRule ? line.creditTaxRule.label : ''}
                </div>
              </div>
            </td>
            <td class="text">
              {line.creditAccount}<br/>
              {line.creditSubAccount}
            </td>
            <td class="number">
              {#if ( line.creditAccount !== '')}
              {formatMoney(line.creditAmount)}<br/>
              {formatMoney(line.creditTax)}
              {/if}
            </td>
          </tr>
          {/each}
          {#if ( pc + 1 === date.pages.length )}
          <tr class="total">
            <td colspan="2">
            </td>
            <td class="number">
              {formatMoney(date.sums.debitAmount)}<br/>
              {formatMoney(date.sums.debitTax)}
            </td>
            <td>
            </td>
            <td class="text"><BilingualText key="total" /></td>
            <td>
            </td>
            <td class="number">
              {formatMoney(date.sums.creditAmount)}<br/>
              {formatMoney(date.sums.creditTax)}
            </td>
          </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
{/each}
{/each}
<script>
import FrontCover from '../components/front-cover.svelte';
import PageHeader from '../components/page-header.svelte';
import {formatMoney} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let fy;
export let company;
export let dates;
</script>