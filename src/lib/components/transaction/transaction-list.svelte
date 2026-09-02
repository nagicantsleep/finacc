<div class="list">
  <div class="page-title d-flex justify-content-between align-items-center flex-wrap">
    <h1 class="page-title-bilingual mb-0"><BilingualText key="transaction_list" inline={true} /></h1>
    <button type="button" class="btn btn-primary btn-bilingual flex-shrink-0"
      on:click={() => {
        link('/transaction/new');
      }}
      id="transaction-info"><BilingualText key="new_entry" inline={true} /><i class="bi bi-pencil-square"></i></button>
  </div>
  <div class="full-height-1 fontsize-12pt table-responsive">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 150px;"><BilingualText key="kind" /></th>
          <th scope="col" style="width: 300px;"><BilingualText key="counterparty" /></th>
          <th scope="col" style=""><BilingualText key="task_subject" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="person_in_charge" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="occurrence_date" /></th>
          <th scope="col" style="width: 120px;"><BilingualText key="amount" /></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:5px;">
            <select class="form-select" id="kind"
              on:input={changeKind}
              value={filters.kind ? parseInt(filters.kind, 10) : -1}>
              <option value={-1}><BilingualText key="all" /></option>
              {#each transactionKinds as ent (ent.id)}
              <option value={ent.id}>{ent.label}</option>
              {/each}
            </select>
          </td>
          <td style="padding:5px;">
            <CompanySelect
              register=false
              clientOnly=true
              bind:value={companyId}
              on:input={changeCompany}>
            </CompanySelect>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td style="text-align:right;">
          </td>
        </tr>
        {#each transactions as line (line.id)}
        <tr>
          <td>
            {line.kindId ? line.kind.label : '_'}
          </td>
          <td>
            {#if (line.companyId)}
            <button type="button" class="btn btn-link"
              on:click={() => {
                link(`/company/entry/${line.companyId}`);
              }}>
              {line.companyName ? line.companyName : line.company.name}
            </button>
            {:else}
            {line.companyName ? line.companyName : '__' }
            {/if}
          </td>
          <td>
            <button type="button" class="btn btn-link"
              on:click={() => {
                link(`/transaction/entry/${line.id}`)
              }}>
              {line.subject ? line.subject : '__'}
            </button>
          </td>
          <td>
            { line.handleUser ? (line.handleUser.memberships?.[0]?.tradingName || line.handleUser.legalName || '') : '__'}
          </td>
          <td>
            {formatDate(line.issueDate)}
          </td>
          <td class="number">
            {numeric(line.amount).toLocaleString()}
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
.page-title-bilingual {
  display: inline-flex;
  align-items: center;
  line-height: 1.3;
}
.btn-bilingual {
  min-height: 56px;
  line-height: 1.2;
  white-space: normal;
  padding: 0.25rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.page-title {
  margin-bottom: 1rem;
}
</style>

<script>
import { createEventDispatcher } from 'svelte';
import CompanySelect from '$lib/components/CompanySelect.svelte';
import { numeric, formatDate } from '$lib/utils.js';
import { link } from '$lib/client/router.js';
import BilingualText from '$lib/components/BilingualText.svelte';

const dispatch = createEventDispatcher();

export let transactions = [];
export let transactionKinds = [];
export let filters = {};

let companyId = filters.company || '';

$: companyId = filters.company || '';

const changeKind = (event) => {
  const value = parseInt(event.currentTarget.value, 10);
  dispatch('filter', {
    kind: Number.isFinite(value) && value > 0 ? value : undefined
  });
};

const changeCompany = (event) => {
  dispatch('filter', {
    company: event.detail || undefined
  });
};
</script>
