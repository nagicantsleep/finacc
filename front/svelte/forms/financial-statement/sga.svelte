<div class="page">
  <div class="detail-page">
    <PageHeader
      {company}
      {fy}
      titleKey="sga_breakdown"
      ></PageHeader>
    <div class="page-body">
      <table class="table-narrow">
        <thead>
          <tr>
            <th><BilingualText key="account" /></th>
            <th><BilingualText key="amount" /></th>
          </tr>
        </thead>
        <tbody>
          {#each sgaPage as line}
          <tr>
            <td class="no-border">
              {line.name}
            </td>
            <td class="number left-border">
              {formatMoney(line.amount)}
            </td>
          </tr>
          {/each}
          <tr class="total">
            <td><BilingualText key="total" /></td>
            <td class="number">
              {formatMoney(sgaSum)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
import {formatMoney} from '../../../../libs/utils.js';
import PageHeader from '../components/page-header.svelte';

import BilingualText from '../../components/bilingual-text.svelte';
export let fy;
export let company;
export let sgaPage;
export let sgaSum;

</script>