<div class="list">
  <div class="page-title d-flex justify-content-between">
    <h1 class="fs-3"><BilingualText key="project_list" /></h1>
    <button type="button" class="btn btn-primary"
    on:click={() => {
      link('/task/new');
    }}
    id="task-info"><BilingualText key="new_entry" /><i class="bi bi-pencil-square"></i></button>
  </div>
  <div class="full-height-1 fontsize-12pt">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 300px;"><BilingualText key="counterparty" /></th>
          <th scope="col"><BilingualText key="task_subject" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="occurrence_date" /></th>
          <th scope="col" style="width: 100px;"><BilingualText key="project_end" /></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:5px;">
            <CompanySelect
              register={false}
              on:input={(event) => {
                const companyId = parseInt(event.detail);
                const newParams = new URLSearchParams(location.search);
                if (companyId > 0) {
                  newParams.set('company', companyId);
                } else {
                  newParams.delete('company');
                }
                const query = newParams.toString();
                link(`/task/list${query ? '?' + query : ''}`);
              }}
              companyId={status.params ? parseInt(status.params.get('company')) : -1}>
            </CompanySelect>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
        </tr>
        {#each tasks as line}
        <tr>
          <td>
            {#if (line.companyId)}
            <button type="button" class="btn btn-link"
              on:click={() => {
                link(`/company/entry/${line.companyId}`)
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
                link(`/task/entry/${line.id}`)
              }}>
              {line.subject ? line.subject : '__'}
            </button>
          </td>
          <td>
            {formatDate(line.issueDate)}
          </td>
          <td>
            {formatDate(line.endedAt)}
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<script>
import axios from 'axios';
import CompanySelect from '../components/company-select.svelte';
import {numeric, formatDate} from '../../../libs/utils.js';
import {onMount, beforeUpdate, afterUpdate } from 'svelte';
import eventBus from '../../javascripts/event-bus.js';
import {parseParams, buildParam} from '../../javascripts/params.js';
import { link } from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
export let status;
export let tasks;

const updateTasks = () => {
  let param = buildParam(status);
  axios.get(`/api/task?${param}`).then((result) => {
    tasks = result.data.tasks;
  });
};

$: if(status && status.params) {
  updateTasks();
}

beforeUpdate(() => {
});

onMount(() => {
})

</script>
