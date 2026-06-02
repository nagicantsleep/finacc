<div class="full-height-2">
  <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th scope="col" style="width: 100px;"><BilingualText key="chart_of_accounts" /></th>
        <th scope="col" style="width: 100px;"><BilingualText key="carry_forward_amount" /></th>
        <th scope="col" style="width: 100px;"><BilingualText key="debit_amount" /></th>
        <th scope="col" style="width: 100px;"><BilingualText key="credit_amount" /></th>
        <th scope="col" style="width: 100px;"><BilingualText key="balance" /></th>
      </tr>
    </thead>
    <tbody>
      {#each lines as line, index }
      <tr>
        <td>
          {#if (line.code)}
          <button type="button" class="btn btn-link"
          	on:click={() => {
              link(`/ledger/${line.code}`);
            }}>
            __ {line.name}
          </button>
          {:else}
          <span>{line.name}</span>
          {/if}
        </td>
        <td class="number">
          {line.pickup ? line.pickup.toLocaleString(): '0'}
        </td>
        <td class="number">
          { !!line.debit ? line.debit.toLocaleString(): '0'}
        </td>
        <td class="number">
          { !!line.credit ? line.credit.toLocaleString() : '0'}
        </td>
        <td class="number">
          {line.balance ? line.balance.toLocaleString(): '0'}
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>

</style>
<script>
import { link } from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
export	let status;
export	let	lines;

</script>
