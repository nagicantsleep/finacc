<script>
  import WorkspaceView from '$lib/components/workspace/workspace.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'workspace',
    pathname: '/workspace',
    state: data.viewState === 'new' ? 'new' : data.viewState === 'entry' ? String(data.workspaceId) : ''
  };
</script>

<svelte:head>
  <title>ワークスペース :: Hieronymus</title>
</svelte:head>

<div class="workspace-page container-fluid px-0">
  <WorkspaceView
    bind:status
    bind:toast
    initialWorkspace={data.workspace}
    viewState={data.viewState}
    workspaceId={data.workspaceId}
  />
  <Toast bind:toast />
</div>
