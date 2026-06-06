<div class="list">
  <div class="page-title d-flex justify-content-between align-items-center flex-wrap">
    <h1 class="page-title-bilingual mb-0"><BilingualText key="project_ledger" inline={true} /></h1>
    <button type="button" class="btn btn-primary btn-bilingual flex-shrink-0"
      on:click={() => {
        openProject(null);
      }}><BilingualText key="new_project_entry_space" inline={true} /><i class="bi bi-pencil-square"></i></button>
  </div>
  <div class="full-height-1 fontsize-12pt">
    <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th scope="col" style="width: 200px;"><BilingualText key="project_name_dup" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="code" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="project_start" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="project_end" /></th>
        <th scope="col" style="width: 120px;"></th>
      </tr>
    </thead>
    <tbody>
      {#each projects as line}
      <tr class="fontsize-12pt">
        <td>
          <button type="button" class="btn btn-link"
            on:click={openProject} data-no={line.id}>
            {line.name}
          </button>
        </td>
        <td>
          {line.code}
        </td>
        <td>
          {line.startDate || ''}
        </td>
        <td>
          {line.endDate || ''}
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-info" on:click={() => openSummary(line)}><BilingualText key="summary_view" /></button>
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
import axios from 'axios';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import { buildParam, parseParams } from '../../javascripts/params';
import { link } from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
export let status;
export let projects;

const updateProjects = (_params) => {
  let param = buildParam(status, _params);
  axios.get(`/api/projects?${param}`).then((result) => {
    projects = result.data;
  });
  if	( _params )	{
    window.history.pushState(
        status, "", `${location.pathname}?${param}`);
  }
};

const openProject = (event) => {
  let	project;
  if  ( event ) {
    let id = event.target.dataset.no;
    for ( let i = 0; i < projects.length; i ++ ) {
      if ( projects[i].id == id ) {
        project = projects[i];
        break;
      }
    }
  } else {
    project = {};
  }
  dispatch('open', project);
}

const openSummary = (project) => {
  link(`/project/summary/${project.id}`);
}

onMount(() => {
  console.log('project-list onMount');
  status.params = parseParams();
  updateProjects();
})
beforeUpdate(() => {
});
</script>