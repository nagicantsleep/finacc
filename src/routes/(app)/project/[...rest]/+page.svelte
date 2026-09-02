<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import ProjectView from '$lib/components/project/project.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'project',
    pathname: '/project',
    state: data.viewState || 'list',
    id: data.resourceId
  };
</script>

<svelte:head>
  <title>{$bi('title_project')} :: Hieronymus</title>
</svelte:head>

<div class="project-page container-fluid px-0">
  <ProjectView
    bind:status
    projects={data.projects}
    selectedProject={data.selectedProject}
    viewState={data.viewState}
    resourceId={data.resourceId}
  />
</div>
