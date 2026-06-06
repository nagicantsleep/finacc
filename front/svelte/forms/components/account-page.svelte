{#each accountPages as page}
<div class="page">
  <div class="detail-page">
    <PageHeader
      {company}
      {fy}
      title={title}
      left_item={$bi('chart_of_accounts')}
    ></PageHeader>
    <div class="page-body">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 70px;"><BilingualText key="account_code" /></th>
            <th><BilingualText key="chart_of_accounts" /></th>
            <th style="width: 50px;"><BilingualText key="tax_type" /></th>
            <th style="width: 120px;"><BilingualText key="debit" /></th>
            <th style="width: 120px;"><BilingualText key="credit" /></th>
            <th style="width: 120px;"><BilingualText key="balance" /></th>
          </tr>
        </thead>
        <tbody>
          {#each page as line}
          <tr>
            <td class="number">
              {line.code}
            </td>
            <td class="text">
              {line.name}
            </td>
            <td>
              {taxClass(line.taxClass)}
            </td>
            <td class="number">
              {formatMoney(line.debit)}
            </td>
            <td class="number">
              {formatMoney(line.credit)}
            </td>
            <td class="number">
              {formatMoney(line.balance)}
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
import {formatMoney, taxClass} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let company;
export let fy;
export let title;
export let accountPages;
</script>