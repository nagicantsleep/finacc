<div class="page">
  <div class="detail-page">
    <PageHeader
      {company}
      {fy}
      titleKey="balance_sheet"
      ></PageHeader>
    <div class="page-body">
      <table class="table-report">
        <thead>
          <tr>
            <th colspan="2">
              <BilingualText key="assets_section" />
            </th>
            <th colspan="2">
              <BilingualText key="liabilities_section" />
            </th>
          </tr>
          <tr>
            <th><BilingualText key="account" /></th>
            <th><BilingualText key="amount" /></th>
            <th><BilingualText key="account" /></th>
            <th><BilingualText key="amount" /></th>
          </tr>
        </thead>
        <tbody>
          {#each bsLines as line}
          <tr>
            {@html line}
          </tr>
          {/each}
          <tr class="total">
            <td><BilingualText key="total_assets" /></td>
            <td class="number">{formatMoney(asset)}</td>
            <td><BilingualText key="total_liabilities_networth" /></td>
            <td class="number">{formatMoney(liabilities + networth)}</td>
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
export let bsLines;
export let asset;
export let liabilities;
export let networth;

</script>