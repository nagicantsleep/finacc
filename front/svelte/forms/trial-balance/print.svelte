{#each pages as page}
<div class="page">
  <div class="detail-page">
    <PageHeader
      {company}
      {fy}
      titleKey={titleKey}
      title={title}
      left_item={sub_title}
    ></PageHeader>
    <div class="page-body">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 100px;"><BilingualText key="chart_of_accounts" /></th>
            <th style="width: 120px;"><BilingualText key="carry_forward_amount" /></th>
            <th style="width: 120px;"><BilingualText key="debit_amount" /></th>
            <th style="width: 120px;"><BilingualText key="credit_amount" /></th>
            <th style="width: 120px;"><BilingualText key="balance" /></th>
          </tr>
        </thead>
        <tbody>
          {#each page as line}
          <tr class={line.total ? "total": ""}>
            <td class="text">
              {@html line.name}
            </td>
            <td class="number">
              {line.pickup ? formatMoney(line.pickup) : ''}
            </td>
            <td class="number">
              {line.debit ? formatMoney(line.debit) : ''}
            </td>
            <td class="number">
              {line.credit ? formatMoney(line.credit) : ''}
            </td>
            <td class="number">
              {line.balance ? formatMoney(line.balance): ''}
            </td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
{/each}
<script>
import PageHeader from '../components/page-header.svelte';
import {formatMoney} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let company;
export let fy;
export let pages;
export let title;
export let titleKey;
export let sub_title;
</script>