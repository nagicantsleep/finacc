<script>
  import ProjectView from '$lib/components/project/project.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'project',
    pathname: '/project'
  };
</script>

<svelte:head>
  <title>プロジェクト会計 :: Hieronymus</title>
</svelte:head>

<div class="project-page container-fluid px-0">
  <ProjectView bind:status />
</div>
