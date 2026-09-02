<div class="card">
  <div class="card-header">
    <h5 class="card-title"><BilingualText key="fiscal_year_select" /></h5>
  </div>
  <div class="card-body">
    <div class="row h-100" style="overflow-y: scroll;">
      <table class="table table-bordered">
        <thead class="table-light">
          <th scol="col"><BilingualText key="fiscal_year" /></th>
          <th col="col"><BilingualText key="start_date" /></th>
          <th col="col"><BilingualText key="end_date" /></th>
          <th col="col"><BilingualText key="tax_included" /></th>
          <th col="col"><BilingualText key="year_end_process" /></th>
        </thead>
        <tbody>
          {#each lines as line}
          <tr>
            <td>
              {#if ( line.term != status.fy.term)}
              <a href="/home/{line.term}">
                {line.term}{$bi('period_suffix')}
              </a>
              {:else}
              <span>
                <i class="fas fa-check"></i>
                {line.term}{$bi('period_suffix')}
              </span>
              {/if}
            </td>
            <td>
              {line.startDate.getFullYear()}{$bi('year')}({wareki(line.startDate)})
              {line.startDate.getMonth()+1}{$bi('month')}
              {line.startDate.getDate()}{$bi('day')}
            </td>
            <td>
              {line.endDate.getFullYear()}{$bi('year')}({wareki(line.endDate)})
              {line.endDate.getMonth()+1}{$bi('month')}
              {line.endDate.getDate()}{$bi('day')}
            </td>
            <td>
              <input type="checkbox" bind:checked={line.taxIncluded}
                on:change={() => change(line)}>
            </td>
            <td>
              {#if ( status.user && status.user.administrable )}
              <a class="btn btn-danger closing" href="/closing/{line.term}/confirm"><BilingualText key="carry_forward" /></a>
              {/if}
            </td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
th {
  text-align: center;
  font-weight: bold;
}
td {
    vertical-align: middle;
}
</style>
<script>
import axios from 'axios';
import {onMount} from 'svelte';
import {wareki} from '$lib/utils.js';

import { bi } from '$lib/i18n/bilingual.js';
import BilingualText from '$lib/components/BilingualText.svelte';
export  let status;
export let fiscalYears = null;

let lines = [];

const mapFiscalYears = (data) =>
  data.map((line) => ({
    id: line.id,
    term: line.term,
    startDate: new Date(line.startDate),
    endDate: new Date(line.endDate),
    taxIncluded: line.taxIncluded
  }));

const change = (line) => {
  axios.put(`/api/term/${line.id}`, line).then(() => {
    lines = undefined;
  })
}

onMount(() => {
  if (fiscalYears?.length) {
    lines = mapFiscalYears(fiscalYears);
    return;
  }
  axios.get('/api/term').then((res) => {
    lines = mapFiscalYears(res.data);
  });
});
</script>
