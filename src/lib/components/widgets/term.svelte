<div class="menu">
	<div class="body">
    <div class="table-responsive">
  	<table class="table table-bordered table-sm mb-0">
    	<thead class="table-light">
      	<tr>
      	<th scope="col">
        	<BilingualText key="fiscal_year" stacked={false} />
	      </th>
  	    <th scope="col">
      	    <BilingualText key="start_date" stacked={false} />
      	</th>
	      <th scope="col">
      	      <BilingualText key="end_date" stacked={false} />
    	  </th>
      	<th scope="col" class="text-center" style="min-width: 4.5rem;">
        	<BilingualText key="tax_included" stacked={false} />
	      </th>
  	    <th scope="col" style="min-width: 6.5rem;">
      	    <BilingualText key="year_end_process" stacked={false} />
	      </th>
      	</tr>
  	  </thead>
    	<tbody>
	      {#each lines as line}
  	    <tr>
      	    <td class="text-nowrap">
      	    {#if ( line.term != status?.fy?.term)}
        	  <a href="/home/{line.term}">
          	  {line.term}<BilingualText key="term" stacked={false} inline={true} />
		          </a>
  	        {:else}
    	      <span>
      	      <i class="fas fa-check"></i>
        	    {line.term}<BilingualText key="term" stacked={false} inline={true} />
		          </span>
  	        {/if}
    	    </td>
      	  <td class="widget-date-cell">
        	  {line.startDate.getFullYear()}{$bi('year')}({wareki(line.startDate)})
		          {line.startDate.getMonth()+1}{$bi('month')}
  	        {line.startDate.getDate()}{$bi('day')}
    	    </td>
      	  <td class="widget-date-cell">
        	  {line.endDate.getFullYear()}{$bi('year')}({wareki(line.endDate)})
		          {line.endDate.getMonth()+1}{$bi('month')}
  	        {line.endDate.getDate()}{$bi('day')}
    	    </td>
      	  <td class="text-center">
        	  <input type="checkbox" bind:checked={line.taxIncluded}
          	  on:change={() => change(line)}>
		        </td>
  	      <td class="text-center">
    	      {#if ( status?.user && status?.user?.administrable )}
      	    <a class="btn btn-danger btn-sm closing" href="/forms/closing/{line.term}">
        	    <BilingualText key="carry_forward" stacked={false} />
		          </a>
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
.widget-date-cell {
  min-width: 9rem;
}
</style>
<script>
import axios from 'axios';
import {onMount} from 'svelte';
import {wareki} from '$lib/utils.js';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';

export let status = {};
export let options = {};

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
  });
};

onMount(() => {
  if (options.fiscalYears?.length) {
    lines = mapFiscalYears(options.fiscalYears);
    return;
  }
  axios.get('/api/term').then((res) => {
    lines = mapFiscalYears(res.data);
  });
});
</script>
