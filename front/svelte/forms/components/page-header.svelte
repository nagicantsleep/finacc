<div class="page-header">
  <div class="ledger-title">
    {#if titleKey}<BilingualText key={titleKey} inline />{:else}{title}{/if}
  </div>
  <div class="company-name">
    {company.name}
  </div>
  <div class="term">
    {fy.year}<BilingualText key="fiscal_year" inline />
  </div>
  <div class="date">
    {formatDate(null, 'ja')}
  </div>
  <div class="left-item">
    {left_item || ''}
  </div>
  <div class="right-item">
    {right_item || ''}
  </div>
</div>

<script>
import {formatDate} from '../../../../libs/utils.js';
import BilingualText from '../../components/bilingual-text.svelte';

export let company;
export let fy;
export let title;
export let titleKey = undefined;
export let right_item;
export let left_item;
</script>