<table class="table">
  <thead>
    <tr>
      <th style="width:250px;"><BilingualText key="product_spec" /></th>
      <th style="width:100px;"><BilingualText key="unit_price" /></th>
      <th style="width:50px;"><BilingualText key="quantity" /></th>
      <th style="width:50px;"><BilingualText key="unit" /></th>
      <th style="width:100px;"><BilingualText key="amount" /><br/><BilingualText key="tax" /></th>
      <th><BilingualText key="remarks" /></th>
    </tr>
  </thead>
  <tbody>
    {#each transaction.lines as line}
    <tr>
      <td class="item" colspan={line.itemId === 0 ? 4 : 1}>
        {#if line.itemId !== 0}
        {@html line.itemName || '&nbsp;'}<br/>
        {@html line.itemSpec || '&nbsp;'}
        {:else}
        ※{$bi('subtotal_marked')}※
        {/if}
      </td>
      {#if line.itemId !== 0}
      <td class="number">@{formatNumber(line.unitPrice)}</td>
      <td class="number">{formatNumber(line.itemNumber)}</td>
      <td>{line.unit || ' '}</td>
      {/if}
      <td class="number">
        {formatMoney(line.amount)}
        {#if line.taxRule?.taxClass === 1 }
        ({formatMoney(line.tax)})
        {:else}
        {formatMoney(line.tax)}
        {/if}
      </td>
      <td class="description">{line.description}</td>
    </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2" rowspan={transaction.taxClass !== 0 ? 3 : 2}></td>
      <td colspan="2" class="sums"><BilingualText key="subtotal_short" /></td>
      <td class="number">{formatMoney(transaction.amount)}</td>
      <td rowspan={transaction.taxClass !== 0 ? 3 : 2}></td>
    </tr>
    {#if transaction.taxClass !== 0}
    <tr>
      <td colspan="2" class="sums"><BilingualText key="tax" /></td>
      <td class="number">
        {formatMoney(transaction.tax)}
      </td>
    </tr>
    {/if}
    <tr>
      <td colspan="2" class="sums"><strong><BilingualText key="grand_total_short" /></strong></td>
      <td class="number">
        <strong>
          {formatMoney(transaction.amount)}
        </strong>
      </td>
    </tr>
  </tfoot>
</table>
<script>
import {BANK_ACCOUNT_TYPE, formatMoney} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let transaction;

const formatNumber = (num) => {
  return num.toLocaleString();
};
</script>