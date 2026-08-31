<div class="list">
  <div class="page-title d-flex justify-content-between align-items-center flex-wrap">
    <h1 class="page-title-bilingual mb-0"><BilingualText key="company_ledger" inline={true} /></h1>
    <button type="button" class="btn btn-primary btn-bilingual flex-shrink-0"
      on:click={() => {
        openCompany(null);
      }}><BilingualText key="company_entry_space" inline={true} /><i class="bi bi-pencil-square"></i></button>
  </div>
  <div class="full-height-1 fontsize-12pt table-responsive">
    <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th scope="col" style="width: 200px;"><BilingualText key="name" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="kind" /></th>
        <th scope="col" style="width: 100px;"><BilingualText key="zip_code" /></th>
        <th scope="col"><BilingualText key="address" /></th>
        <th scope="col" style="width: 120px;"><BilingualText key="tel" /></th>
        <th scope="col" style="width: 100px;">
          E-mail
        </th>
        <th scope="col" style="width: 100px;"><BilingualText key="charge_name" /></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td></td>
        <td>
          <select class="form-select" id="kind"
            on:input={(event) => {
              const value = parseInt(event.currentTarget.value, 10);
              const href = Number.isFinite(value) && value > 0 ? `/company?kind=${value}` : '/company';
              goto(href, { keepFocus: true, noScroll: true });
            }}
            value={kind}>
            <option value={-1}><BilingualText key="all" /></option>
            {#each companyClasses as ent (ent.id)}
            <option value={ent.id}>{ent.name}</option>
            {/each}
          </select>
        </td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      {#each companies as line (line.id)}
      <tr class="fontsize-12pt">
        <td>
          <button type="button" class="btn btn-link"
            on:click={openCompany} data-no={line.id}>
            {line.name}
          </button>
        </td>
        <td>
          {line.companyClass ? line.companyClass.name : $bi('other_class')}
        </td>
        <td>
          {line.zip}
        </td>
        <td>
          {line.address1}<br/>
          {line.address2}
        </td>
        <td>
          {line.telNo}
        </td>
        <td>
          {line.email}
        </td>
        <td>
          {line.chargeName}
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
  </div>
</div>
<style>
th {
  text-align: center;
}
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
import { goto } from '$app/navigation';

import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';

const dispatch = createEventDispatcher();

export let companies = [];
export let companyClasses = [];
export let kind = -1;

const openCompany = (event) => {
  let company;
  if (event) {
    const id = event.currentTarget.dataset.no;
    company = companies.find((row) => String(row.id) === String(id));
  } else {
    company = {};
  }
  dispatch('open', company);
};
</script>
