{#if sgaPage}
<FinancialStatement
  {fy}
  {company}
  {bsLines}
  {plOut}
  {sgaPage}
  {sgaSum}
  {asset}
  {liabilities}
  {networth}
  ></FinancialStatement>
{:else}
  <p><BilingualText key="loading" /></p>
{/if}
<script>
import { onMount } from 'svelte';
import myCompany from '../../../../libs/my-company.js';
import initializeFinancialStatement from '../../../../libs/init-financial-statement.js';

import FinancialStatement from './financial-statement.svelte';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let term;

const formatMonth = (date) => {
  return `${date.year}${$bi('year_num')}${date.month}${$bi('month_label')}`;
};

let fy;
let company = {};
let bsLines;
let plOut;
let sgaPage;
let asset;
let liabilities;
let networth;
let sgaSum;

onMount(async () => {
  company = await myCompany();
  console.log({company});
  ({fy, bsLines, plOut, sgaPage, asset, liabilities, networth, sgaSum} = await initializeFinancialStatement(term));
});

</script>