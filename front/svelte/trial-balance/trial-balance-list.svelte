<div class="full-height-2">
  <table class="table table-bordered trial-balance-table">
    <thead class="table-light">
      <tr>
        <th scope="col"><BilingualText key="chart_of_accounts" /></th>
        <th scope="col" class="number"><BilingualText key="carry_forward_amount" /></th>
        <th scope="col" class="number"><BilingualText key="debit_amount" /></th>
        <th scope="col" class="number"><BilingualText key="credit_amount" /></th>
        <th scope="col" class="number"><BilingualText key="balance" /></th>
      </tr>
    </thead>
    <tbody>
      {#each lines as line, index }
      <tr>
        <td>
          {#if (line.code)}
          <button type="button" class="btn btn-link p-0 text-start"
          	on:click={() => {
              link(`/ledger/${line.code}`);
            }}>
            <span class="bilingual-inline">
              <span class="bi-primary">{line.name}</span>
              {#if line.nameVi}
              <span class="bi-sep"> / </span>
              <span class="bi-secondary">{line.nameVi}</span>
              {/if}
            </span>
          </button>
          {:else if line.middle_name}
          <span class="section-header">
            <span class="bilingual-inline">
              <span class="bi-primary">【{line.middle_name}】</span>
              {#if line.middle_nameVi}
              <span class="bi-sep"> / </span>
              <span class="bi-secondary">【{line.middle_nameVi}】</span>
              {/if}
            </span>
          </span>
          {:else}
          <span class="section-subheader">
            <span class="bilingual-inline">
              <span class="bi-primary">{line.minor_name}</span>
              {#if line.minor_nameVi}
              <span class="bi-sep"> / </span>
              <span class="bi-secondary">{line.minor_nameVi}</span>
              {/if}
            </span>
          </span>
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
  :global(.trial-balance-table th) {
    white-space: nowrap;
  }
  :global(.trial-balance-table th.number) {
    width: 100px;
    text-align: right;
  }
  :global(.trial-balance-table td.number) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  :global(.trial-balance-table .section-header) {
    font-weight: 600;
  }
  :global(.trial-balance-table .section-subheader) {
    font-weight: 500;
  }
  :global(.trial-balance-table .bilingual-inline) {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25em;
    flex-wrap: wrap;
  }
  :global(.trial-balance-table .bi-primary) {
    font-weight: 600;
  }
  :global(.trial-balance-table .bi-secondary) {
    font-size: 0.85em;
  }
  :global(.trial-balance-table .bi-sep) {
    opacity: 0.5;
  }
</style>
<script>
import { link } from '../../javascripts/router.js';
import BilingualText from '../components/bilingual-text.svelte';
export	let status;
export	let	lines;

</script>
