<script>
import {formatDate} from '../../../../libs/utils.js';
import { bi } from '../../../javascripts/bilingual.js';

export let title;
export let titleKey;
export let company;
export let fy;

$: displayTitle = titleKey ? bi(titleKey) : title;
</script>

<svelte:head>
  <title>{displayTitle}::Hieronymus</title>
  <meta http-equiv="Content-Language" content="ja" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/style/paperA4.css">
</svelte:head>

<div class="page">
  <div class="title-page">
    <div class="title">
      {displayTitle}
    </div>
    <div class="company-name">
      {company.name}
    </div>
    <div class="term">
      {fy.year}{bi('fiscal_year')}
    </div>
    <div class="month">
      {formatDate(fy.startDate, 'ja')}〜
      {formatDate(fy.endDate, 'ja')}
    </div>
  </div>
</div>
