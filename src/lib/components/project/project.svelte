{#if viewState === 'list'}
  <ProjectList
    bind:status={status}
    projects={projects}
    on:open={openEntry}
  ></ProjectList>
{:else if viewState === 'home'}
  <ProjectHome bind:status={status}></ProjectHome>
{:else if viewState === 'labels'}
  {#await import('./project-labels.svelte') then { default: ProjectLabels }}
    <ProjectLabels bind:status={status}></ProjectLabels>
  {/await}
{:else if viewState === 'settings'}
  {#await import('./project-label-settings.svelte') then { default: ProjectLabelSettings }}
    <ProjectLabelSettings bind:status={status}></ProjectLabelSettings>
  {/await}
{:else if viewState === 'summary'}
  {#await import('./project-summary.svelte') then { default: ProjectSummary }}
    <ProjectSummary bind:status={status} initialProjects={projects}></ProjectSummary>
  {/await}
{:else if (viewState === 'entry' && project && project.id) || (viewState === 'new' && project)}
  {#await import('./project-entry.svelte') then { default: ProjectEntry }}
    <ProjectEntry
      bind:status={status}
      bind:project={project}
      on:close={closeEntry}
    ></ProjectEntry>
  {/await}
{/if}

<script>
import { goto } from '$app/navigation';
import ProjectList from './project-list.svelte';
import ProjectHome from './project-home.svelte';
import { currentProject } from '$lib/client/current-record.js';
import { link } from '$lib/client/router.js';

export let status;
export let projects = [];
export let selectedProject = null;
export let viewState = 'list';
export let resourceId = null;

let project = selectedProject;

$: project = selectedProject;
$: if (status) {
  status.state = viewState;
  status.id = resourceId;
}

const openEntry = (event) => {
  const projectData = event.detail;
  if (!projectData || !projectData.id) {
    link('/project/new');
  } else {
    link(`/project/entry/${projectData.id}`);
  }
};

const closeEntry = () => {
  currentProject.set(null);
  goto('/project');
};
</script>
