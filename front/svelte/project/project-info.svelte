<input type="hidden" id="id" value={project.id}>
<div class="container-fluid">
  <div class="row mb-3">
    <label for="name" class="col-2 col-form-label"><BilingualText key="project_name_dup" /></label>
    <div class="col-sm-10">
      <input type="text" class="form-control" id="name" bind:value={project.name}>
    </div>
  </div>
  <div class="row mb-3">
    <label for="code" class="col-2 col-form-label"><BilingualText key="code" /></label>
    <div class="col-sm-10">
      <input type="text" class="form-control" id="code" bind:value={project.code}>
    </div>
  </div>
  <div class="row mb-3">
    <label for="startDate" class="col-2 col-form-label"><BilingualText key="project_start" /></label>
    <div class="col-sm-3">
      <input type="date" class="form-control" id="startDate" bind:value={project.startDate}>
    </div>
  </div>
  <div class="row mb-3">
    <label for="endDate" class="col-2 col-form-label"><BilingualText key="project_end" /></label>
    <div class="col-sm-3">
      <input type="date" class="form-control" id="endDate" bind:value={project.endDate}>
    </div>
  </div>
</div>

<style>
</style>
<script>
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';

import BilingualText from '../components/bilingual-text.svelte';
export let status;
export let	project;

onMount(() => {
})

beforeUpdate(() => {
});
</script>
