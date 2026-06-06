<div class="full-height-2">
  <table class="table table-bordered trial-balance-table">
    <thead class="table-light">
      <tr>
        <th scope="col" class="name-col"><BilingualText key="chart_of_accounts" stacked={false} /></th>
        <th scope="col" class="number-col"><BilingualText key="carry_forward_amount" stacked={false} /></th>
        <th scope="col" class="number-col"><BilingualText key="debit_amount" stacked={false} /></th>
        <th scope="col" class="number-col"><BilingualText key="credit_amount" stacked={false} /></th>
        <th scope="col" class="number-col"><BilingualText key="balance" stacked={false} /></th>
      </tr>
    </thead>
    <tbody>
      {#each lines as line, index }
      <tr>
        <td class="name-col">
          {#if (line.code)}
          <button type="button" class="btn btn-link p-0 text-start name-btn"
          	on:click={() => {
              link(`/ledger/${line.code}`);
            }}>
            <span class="bi-pair"><span class="bi-primary">{line.name}</span>{#if line.nameVi}<span class="bi-sep"> / </span><span class="bi-secondary">{line.nameVi}</span>{/if}</span>
          </button>
          {:else if line.middle_name}
          <div class="section-header"><span class="bi-pair"><span class="bi-primary">【{line.middle_name}】</span>{#if line.middle_nameVi}<span class="bi-sep"> / </span><span class="bi-secondary">【{line.middle_nameVi}】</span>{/if}</span></div>
          {:else}
          <div class="section-subheader"><span class="bi-pair"><span class="bi-primary">{line.minor_name}</span>{#if line.minor_nameVi}<span class="bi-sep"> / </span><span class="bi-secondary">{line.minor_nameVi}</span>{/if}</span></div>
          {/if}
        </td>
        <td class="number-col">{line.pickup ? line.pickup.toLocaleString(): '0'}</td>
        <td class="number-col">{ !!line.debit ? line.debit.toLocaleString(): '0'}</td>
        <td class="number-col">{ !!line.credit ? line.credit.toLocaleString() : '0'}</td>
        <td class="number-col">{line.balance ? line.balance.toLocaleString(): '0'}</td>
      </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  :global(.trial-balance-table) {
    table-layout: auto;
  }
  :global(.trial-balance-table .name-col) {
    white-space: nowrap;
  }
  :global(.trial-balance-table .number-col) {
    width: 100px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  :global(.trial-balance-table .section-header) {
    font-weight: 600;
  }
  :global(.trial-balance-table .section-subheader) {
    font-weight: 500;
  }
  :global(.trial-balance-table .section-header .bi-primary),
  :global(.trial-balance-table .section-subheader .bi-primary) {
    font-weight: inherit;
  }
  :global(.trial-balance-table .bi-pair) {
    white-space: nowrap;
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
  :global(.trial-balance-table .name-btn) {
    display: inline;
    border: 0;
    font-size: inherit;
    line-height: inherit;
    vertical-align: baseline;
  }
</style>
<script>
import { link } from '../../javascripts/router.js';
import BilingualText from '../components/bilingual-text.svelte';
export	let status;
export	let	lines;

</script>
